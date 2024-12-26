#include "esp_websocket_client.h"
#include "esp_wifi.h"
#include "esp_log.h"
#include "hardware_control.h"
#include "cJSON.h"
#include "config.h"

static const char *TAG = "WEBSOCKET";
static esp_websocket_client_handle_t client;
static bool lock_state = true;  // Start locked

void wifi_init_sta(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();
    
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS,
        },
    };
    
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    ESP_ERROR_CHECK(esp_wifi_connect());
}

void send_status_update(const char *status) {
    // Create a JSON object for the status update message
    cJSON *status_update = cJSON_CreateObject();
    cJSON_AddStringToObject(status_update, "type", "status_update");
    cJSON_AddStringToObject(status_update, "machineId", MACHINE_ID);
    cJSON_AddStringToObject(status_update, "status", status);
    
    // Convert the JSON object to a string
    char *status_update_str = cJSON_Print(status_update);
    
    // Send the status update over WebSocket
    ESP_LOGI(TAG, "Sending status update: %s", status_update_str); // Log outgoing status update
    esp_websocket_client_send_text(client, status_update_str, strlen(status_update_str), pdMS_TO_TICKS(1000));
    
    // Clean up
    free(status_update_str);
    cJSON_Delete(status_update);
}

static void websocket_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
    
    switch (event_id) {
        case WEBSOCKET_EVENT_CONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
            update_lcd_status("Connected"); // Show connection status
            
            // Send registration message
            cJSON *reg = cJSON_CreateObject();
            cJSON_AddStringToObject(reg, "type", "register");
            cJSON_AddStringToObject(reg, "role", "machine");
            cJSON_AddStringToObject(reg, "machineId", MACHINE_ID);
            cJSON_AddStringToObject(reg, "status", "locked");
            
            char *reg_str = cJSON_Print(reg);
            ESP_LOGI(TAG, "Sending registration: %s", reg_str); // Log outgoing message
            esp_websocket_client_send_text(client, reg_str, strlen(reg_str), pdMS_TO_TICKS(1000));
            free(reg_str);
            cJSON_Delete(reg);
            break;
            
        case WEBSOCKET_EVENT_DATA:
            ESP_LOGI(TAG, "Received WebSocket data: %.*s", data->data_len, (char *)data->data_ptr); // Log incoming message
            if (data->data_len > 0) {
                cJSON *root = cJSON_Parse((char *)data->data_ptr);
                if (root) {
                    const char *type = cJSON_GetObjectItem(root, "type")->valuestring;
                    if (strcmp(type, "command") == 0) {
                        const char *command = cJSON_GetObjectItem(root, "command")->valuestring;
                        if (strcmp(command, "lock") == 0) {
                            ESP_LOGI(TAG, "Processing lock command");
                            lock_state = true;
                            update_lock_state(true);
                            update_lcd_status("LOCKED");
                            send_status_update("locked");
                        } else if (strcmp(command, "unlock") == 0) {
                            ESP_LOGI(TAG, "Processing unlock command");
                            lock_state = false;
                            update_lock_state(false);
                            update_lcd_status("UNLOCKED");
                            send_status_update("unlocked");
                        }
                    }
                    cJSON_Delete(root);
                }
            }
            break;
            
        case WEBSOCKET_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
            update_lcd_status("Disconnected"); // Show disconnection status
            break;
            
        case WEBSOCKET_EVENT_ERROR:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_ERROR");
            update_lcd_status("Error"); // Show error status
            break;
    }
}

void websocket_client_task(void *pvParameters)
{
    esp_websocket_client_config_t websocket_cfg = {
        .uri = WS_URI,
    };

    client = esp_websocket_client_init(&websocket_cfg);
    esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY, websocket_event_handler, NULL);
    
    esp_websocket_client_start(client);

    while (1) {
        cJSON *heartbeat = cJSON_CreateObject();
        cJSON_AddStringToObject(heartbeat, "type", "heartbeat");
        cJSON_AddStringToObject(heartbeat, "machineId", MACHINE_ID);
        
        char *heartbeat_str = cJSON_Print(heartbeat);
        ESP_LOGI(TAG, "Sending heartbeat: %s", heartbeat_str); // Log heartbeat
        esp_websocket_client_send_text(client, heartbeat_str, strlen(heartbeat_str), pdMS_TO_TICKS(1000));
        free(heartbeat_str);
        cJSON_Delete(heartbeat);
        
        vTaskDelay(pdMS_TO_TICKS(30000));
    }
}