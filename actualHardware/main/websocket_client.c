#include "esp_websocket_client.h"
#include "wifi_init.h"
#include "esp_wifi.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "hardware_control.h"
#include "cJSON.h"
#include "config.h"

static const char *TAG = "WEBSOCKET";
static esp_websocket_client_handle_t client;
static bool lock_state = true;  // Start locked

// Initialize WiFi in station mode => moved to wifi_init.c

// Helper function to log errors
static void log_error_if_nonzero(const char *message, int error_code)
{
    if (error_code != 0) {
        ESP_LOGE(TAG, "Last error %s: 0x%x", message, error_code);
    }
}

void send_status_update(const char *status) {
    if (!esp_websocket_client_is_connected(client)) {
        ESP_LOGW(TAG, "Cannot send status update - client not connected");
        return;
    }

    cJSON *status_update = cJSON_CreateObject();
    if (status_update == NULL) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        return;
    }

    cJSON_AddStringToObject(status_update, "type", "status_update");
    cJSON_AddStringToObject(status_update, "machineId", MACHINE_ID);
    cJSON_AddStringToObject(status_update, "status", status);
    
    char *status_update_str = cJSON_Print(status_update);
    if (status_update_str != NULL) {
        ESP_LOGI(TAG, "Sending status update: %s", status_update_str);
        int err = esp_websocket_client_send_text(client, status_update_str, strlen(status_update_str), portMAX_DELAY);
        if (err < 0) {
            ESP_LOGE(TAG, "Failed to send status update");
        }
        free(status_update_str);
    }
    
    cJSON_Delete(status_update);
}

static void websocket_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
    
    switch (event_id) {
        case WEBSOCKET_EVENT_CONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
            update_lcd_status("Connected");
            
            // Send registration message
            cJSON *reg = cJSON_CreateObject();
            if (reg != NULL) {
                cJSON_AddStringToObject(reg, "type", "register");
                cJSON_AddStringToObject(reg, "role", "machine");
                cJSON_AddStringToObject(reg, "machineId", MACHINE_ID);
                cJSON_AddStringToObject(reg, "status", lock_state ? "locked" : "unlocked");
                
                char *reg_str = cJSON_Print(reg);
                if (reg_str != NULL) {
                    ESP_LOGI(TAG, "Sending registration: %s", reg_str);
                    esp_websocket_client_send_text(client, reg_str, strlen(reg_str), portMAX_DELAY);
                    free(reg_str);
                }
                cJSON_Delete(reg);
            }
            break;
            
        case WEBSOCKET_EVENT_DATA:
            if (data->data_len > 0) {
                ESP_LOGI(TAG, "Received: %.*s", data->data_len, (char *)data->data_ptr);
                
                cJSON *root = cJSON_Parse((char *)data->data_ptr);
                if (root != NULL) {
                    const cJSON *type = cJSON_GetObjectItem(root, "type");
                    if (cJSON_IsString(type) && type->valuestring != NULL) {
                        if (strcmp(type->valuestring, "command") == 0) {
                            const cJSON *command = cJSON_GetObjectItem(root, "command");
                            if (cJSON_IsString(command) && command->valuestring != NULL) {
                                if (strcmp(command->valuestring, "lock") == 0) {
                                    ESP_LOGI(TAG, "Processing lock command");
                                    lock_state = true;
                                    update_lock_state(true);
                                    update_lcd_status("LOCKED");
                                    send_status_update("locked");
                                } else if (strcmp(command->valuestring, "unlock") == 0) {
                                    ESP_LOGI(TAG, "Processing unlock command");
                                    lock_state = false;
                                    update_lock_state(false);
                                    update_lcd_status("UNLOCKED");
                                    send_status_update("unlocked");
                                }
                            }
                        }
                    }
                    cJSON_Delete(root);
                }
            }
            break;
            
        case WEBSOCKET_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
            log_error_if_nonzero("HTTP status code", data->error_handle.esp_ws_handshake_status_code);
            if (data->error_handle.error_type == WEBSOCKET_ERROR_TYPE_TCP_TRANSPORT) {
                log_error_if_nonzero("reported from esp-tls", data->error_handle.esp_tls_last_esp_err);
                log_error_if_nonzero("reported from tls stack", data->error_handle.esp_tls_stack_err);
                log_error_if_nonzero("captured as transport's socket errno", data->error_handle.esp_transport_sock_errno);
            }
            update_lcd_status("Disconnected");
            break;
            
        case WEBSOCKET_EVENT_ERROR:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_ERROR");
            log_error_if_nonzero("HTTP status code", data->error_handle.esp_ws_handshake_status_code);
            if (data->error_handle.error_type == WEBSOCKET_ERROR_TYPE_TCP_TRANSPORT) {
                log_error_if_nonzero("reported from esp-tls", data->error_handle.esp_tls_last_esp_err);
                log_error_if_nonzero("reported from tls stack", data->error_handle.esp_tls_stack_err);
                log_error_if_nonzero("captured as transport's socket errno", data->error_handle.esp_transport_sock_errno);
            }
            update_lcd_status("Error");
            break;
    }
}

void websocket_client_task(void *pvParameters)
{
    esp_websocket_client_config_t websocket_cfg = {
        .uri = WS_URI,
        .reconnect_timeout_ms = 10000,
        .network_timeout_ms = 10000,
    };

    ESP_LOGI(TAG, "Connecting to %s...", websocket_cfg.uri);
    
    client = esp_websocket_client_init(&websocket_cfg);
    if (client == NULL) {
        ESP_LOGE(TAG, "Failed to initialize websocket client");
        vTaskDelete(NULL);
        return;
    }
    
    esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY, websocket_event_handler, NULL);
    
    esp_err_t start_ret = esp_websocket_client_start(client);
    if (start_ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start websocket client: %d", start_ret);
        esp_websocket_client_destroy(client);
        vTaskDelete(NULL);
        return;
    }

    while (1) {
        if (esp_websocket_client_is_connected(client)) {
            cJSON *heartbeat = cJSON_CreateObject();
            if (heartbeat != NULL) {
                cJSON_AddStringToObject(heartbeat, "type", "heartbeat");
                cJSON_AddStringToObject(heartbeat, "machineId", MACHINE_ID);
                
                char *heartbeat_str = cJSON_Print(heartbeat);
                if (heartbeat_str != NULL) {
                    ESP_LOGI(TAG, "Sending heartbeat: %s", heartbeat_str);
                    esp_websocket_client_send_text(client, heartbeat_str, strlen(heartbeat_str), portMAX_DELAY);
                    free(heartbeat_str);
                }
                cJSON_Delete(heartbeat);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(30000));  // 30 second heartbeat interval
    }
}