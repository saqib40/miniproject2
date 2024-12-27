#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_websocket_client.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "cJSON.h"

#define WIFI_SSID      "saqibLovesECE"
#define WIFI_PASS      "123okok123"
#define WS_URI         "ws://192.168.43.243:4000"
#define MACHINE_ID     "676697a3332458612824dca2"

// WiFi event group bits
#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1

static const char *TAG = "ESP32_LOCK";
static esp_websocket_client_handle_t client;
static bool lock_state = true;  // Start locked
static TaskHandle_t heartbeat_task_handle = NULL;
static EventGroupHandle_t wifi_event_group;

// Function declarations
static void send_status_update(void);
static void control_lock(bool lock);

static void send_websocket_message(const char *message) {
    if (esp_websocket_client_is_connected(client)) {
        esp_websocket_client_send_text(client, message, strlen(message), portMAX_DELAY);
        ESP_LOGI(TAG, "Message sent: %s", message);
    }
}

static void send_status_update(void) {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "type", "status_update");
    cJSON_AddStringToObject(root, "role", "machine");  // Added role
    cJSON_AddStringToObject(root, "machineId", MACHINE_ID);
    cJSON_AddStringToObject(root, "status", lock_state ? "locked" : "unlocked");
    
    char *message = cJSON_Print(root);
    send_websocket_message(message);
    
    free(message);
    cJSON_Delete(root);
}

static void control_lock(bool lock) {
    lock_state = lock;
    ESP_LOGI(TAG, "Lock state changed to: %s", lock ? "locked" : "unlocked");
    // TODO: Add GPIO control for actual lock mechanism
    send_status_update();
}

static void handle_websocket_message(const char *data) {
    cJSON *root = cJSON_Parse(data);
    if (root == NULL) {
        ESP_LOGE(TAG, "Failed to parse JSON");
        return;
    }

    cJSON *type = cJSON_GetObjectItem(root, "type");
    if (cJSON_IsString(type) && strcmp(type->valuestring, "command") == 0) {
        cJSON *command = cJSON_GetObjectItem(root, "command");
        if (cJSON_IsString(command)) {
            if (strcmp(command->valuestring, "lock") == 0) {
                control_lock(true);
            } else if (strcmp(command->valuestring, "unlock") == 0) {
                control_lock(false);
            }
        }
    }

    cJSON_Delete(root);
}

static void heartbeat_task(void *pvParameters) {
    while (1) {
        if (esp_websocket_client_is_connected(client)) {
            cJSON *root = cJSON_CreateObject();
            cJSON_AddStringToObject(root, "type", "heartbeat");
            cJSON_AddStringToObject(root, "role", "machine");  // Added role
            cJSON_AddStringToObject(root, "machineId", MACHINE_ID);
            
            char *message = cJSON_Print(root);
            send_websocket_message(message);
            
            free(message);
            cJSON_Delete(root);
        }
        vTaskDelay(pdMS_TO_TICKS(30000));  // 30 second delay
    }
}

static void websocket_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
    
    switch (event_id) {
        case WEBSOCKET_EVENT_CONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
            
            // Send registration message
            cJSON *root = cJSON_CreateObject();
            cJSON_AddStringToObject(root, "type", "register");
            cJSON_AddStringToObject(root, "role", "machine");
            cJSON_AddStringToObject(root, "machineId", MACHINE_ID);
            cJSON_AddStringToObject(root, "status", "locked");
            
            char *message = cJSON_Print(root);
            // Log the exact message being sent
            ESP_LOGI(TAG, "Sending registration message: %s", message);

            send_websocket_message(message);
            
            free(message);
            cJSON_Delete(root);
            
            // Start heartbeat task
            xTaskCreate(heartbeat_task, "heartbeat_task", 4096, NULL, 5, &heartbeat_task_handle);
            break;
            
        case WEBSOCKET_EVENT_DATA:
            if (data->op_code == WS_TRANSPORT_OPCODES_TEXT) {
                char *payload = malloc(data->data_len + 1);
                memcpy(payload, data->data_ptr, data->data_len);
                payload[data->data_len] = '\0';
                handle_websocket_message(payload);
                free(payload);
            }
            break;
            
        case WEBSOCKET_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
            if (heartbeat_task_handle != NULL) {
                vTaskDelete(heartbeat_task_handle);
                heartbeat_task_handle = NULL;
            }
            break;
            
        case WEBSOCKET_EVENT_ERROR:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_ERROR");
            break;
    }
}

static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                             int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT) {
        if (event_id == WIFI_EVENT_STA_START) {
            esp_wifi_connect();
        } else if (event_id == WIFI_EVENT_STA_DISCONNECTED) {
            ESP_LOGI(TAG, "WiFi disconnected, trying to reconnect...");
            esp_wifi_connect();
            xEventGroupClearBits(wifi_event_group, WIFI_CONNECTED_BIT);
        }
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        xEventGroupSetBits(wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

static void wifi_init(void) {
    wifi_event_group = xEventGroupCreate();

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                      ESP_EVENT_ANY_ID,
                                                      &wifi_event_handler,
                                                      NULL,
                                                      &instance_any_id));
    
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                      IP_EVENT_STA_GOT_IP,
                                                      &wifi_event_handler,
                                                      NULL,
                                                      &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "wifi_init finished.");
}

void app_main(void) {
    ESP_LOGI(TAG, "ESP32 Lock Control Starting");
    
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize WiFi
    wifi_init();

    // Wait for WiFi connection
    EventBits_t bits = xEventGroupWaitBits(wifi_event_group,
                                          WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                          pdFALSE,
                                          pdFALSE,
                                          portMAX_DELAY);

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "Connected to WiFi. Starting WebSocket client...");
        
        // WebSocket client configuration
        esp_websocket_client_config_t websocket_cfg = {
            .uri = WS_URI,
        };

        client = esp_websocket_client_init(&websocket_cfg);
        esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY, websocket_event_handler, NULL);
        esp_websocket_client_start(client);
    } else {
        ESP_LOGE(TAG, "Failed to connect to WiFi");
    }
}

