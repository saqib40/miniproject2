#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "esp_system.h"
#include "esp_netif.h"
#include "esp_tls.h"
#include "esp_websocket_client.h"
#include "cJSON.h"
#include "driver/gpio.h"

#define WIFI_SSID      "YOUR_WIFI_SSID"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"
#define WS_URI        "ws://your-server:4000"
#define MACHINE_ID    "your-machine-id"  // Get this from server when registering

static const char *TAG = "WEBSOCKET";
static EventGroupHandle_t wifi_event_group;
static esp_websocket_client_handle_t client = NULL;
static const int CONNECTED_BIT = BIT0;

// GPIO pin for lock control
#define LOCK_PIN 2  // Change this to your actual lock control pin
static bool lock_state = true;  // true = locked, false = unlocked

// Function declarations
static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                             int32_t event_id, void* event_data);
static void websocket_event_handler(void* arg, esp_event_base_t event_base,
                                  int32_t event_id, void* event_data);
static void initialize_wifi(void);
static void send_heartbeat(void *pvParameters);
static void control_lock(bool lock);
static void send_status_update(void);

// Initialize WiFi
static void initialize_wifi(void) {
    wifi_event_group = xEventGroupCreate();
    
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, 
                                             &wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, 
                                             &wifi_event_handler, NULL));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASSWORD,
        },
    };
    
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
}

// WiFi event handler
static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                             int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        esp_wifi_connect();
        xEventGroupClearBits(wifi_event_group, CONNECTED_BIT);
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        xEventGroupSetBits(wifi_event_group, CONNECTED_BIT);
    }
}

// Send heartbeat message
static void send_heartbeat(void *pvParameters) {
    while (1) {
        if (esp_websocket_client_is_connected(client)) {
            cJSON *root = cJSON_CreateObject();
            cJSON_AddStringToObject(root, "type", "heartbeat");
            char *msg = cJSON_PrintUnformatted(root);
            esp_websocket_client_send_text(client, msg, strlen(msg), portMAX_DELAY);
            free(msg);
            cJSON_Delete(root);
        }
        vTaskDelay(pdMS_TO_TICKS(30000)); // Send heartbeat every 30 seconds
    }
}

// Control the lock
static void control_lock(bool lock) {
    lock_state = lock;
    gpio_set_level(LOCK_PIN, lock ? 1 : 0);
    send_status_update();
}

// Send status update
static void send_status_update(void) {
    if (esp_websocket_client_is_connected(client)) {
        cJSON *root = cJSON_CreateObject();
        cJSON_AddStringToObject(root, "type", "status_update");
        cJSON_AddStringToObject(root, "status", lock_state ? "locked" : "unlocked");
        char *msg = cJSON_PrintUnformatted(root);
        esp_websocket_client_send_text(client, msg, strlen(msg), portMAX_DELAY);
        free(msg);
        cJSON_Delete(root);
    }
}

// WebSocket event handler
static void websocket_event_handler(void* arg, esp_event_base_t event_base,
                                  int32_t event_id, void* event_data) {
    esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
    
    switch (event_id) {
        case WEBSOCKET_EVENT_CONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
            // Send registration message
            cJSON *root = cJSON_CreateObject();
            cJSON_AddStringToObject(root, "type", "register");
            cJSON_AddStringToObject(root, "machineId", MACHINE_ID);
            cJSON_AddStringToObject(root, "status", lock_state ? "locked" : "unlocked");
            char *msg = cJSON_PrintUnformatted(root);
            esp_websocket_client_send_text(client, msg, strlen(msg), portMAX_DELAY);
            free(msg);
            cJSON_Delete(root);
            break;
            
        case WEBSOCKET_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
            break;
            
        case WEBSOCKET_EVENT_DATA:
            if (data->op_code == 0x08 && data->data_len == 0) {
                ESP_LOGW(TAG, "Received closed signal");
                break;
            }
            
            if (data->data_len) {
                // Parse JSON command
                cJSON *root = cJSON_Parse((char*)data->data_ptr);
                if (root) {
                    cJSON *type = cJSON_GetObjectItem(root, "type");
                    if (type && cJSON_IsString(type)) {
                        if (strcmp(type->valuestring, "command") == 0) {
                            cJSON *cmd = cJSON_GetObjectItem(root, "command");
                            if (cmd && cJSON_IsString(cmd)) {
                                if (strcmp(cmd->valuestring, "lock") == 0) {
                                    control_lock(true);
                                } else if (strcmp(cmd->valuestring, "unlock") == 0) {
                                    control_lock(false);
                                }
                            }
                        }
                    }
                    cJSON_Delete(root);
                }
            }
            break;
            
        case WEBSOCKET_EVENT_ERROR:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_ERROR");
            break;
    }
}

void app_main(void) {
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize system components
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    // Setup GPIO for lock control
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << LOCK_PIN),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&io_conf);
    control_lock(true);  // Start in locked state

    // Initialize WiFi
    initialize_wifi();

    // Wait for WiFi connection
    xEventGroupWaitBits(wifi_event_group, CONNECTED_BIT, false, true, portMAX_DELAY);

    // Configure WebSocket
    esp_websocket_client_config_t websocket_cfg = {
        .uri = WS_URI,
        .reconnect_timeout_ms = 10000,
        .network_timeout_ms = 10000,
    };

    client = esp_websocket_client_init(&websocket_cfg);
    esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY, websocket_event_handler, NULL);

    // Start WebSocket client
    esp_websocket_client_start(client);

    // Create heartbeat task
    xTaskCreate(send_heartbeat, "heartbeat", 4096, NULL, 5, NULL);

    while (1) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}