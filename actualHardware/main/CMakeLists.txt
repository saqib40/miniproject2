idf_component_register(
    SRCS "actualHardware.c"
         "websocket_client.c"
         "hardware_control.c"
    INCLUDE_DIRS "./include"
    REQUIRES esp_websocket_client json
    PRIV_REQUIRES esp_wifi driver nvs_flash
)
