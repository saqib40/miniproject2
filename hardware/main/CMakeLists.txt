idf_component_register(SRCS "hardware.c"
                    INCLUDE_DIRS "."
                    PRIV_REQUIRES nvs_flash esp_wifi esp_websocket_client esp_driver_gpio json)
