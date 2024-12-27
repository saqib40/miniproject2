idf_component_register(
    SRCS "testHardware.c"
    INCLUDE_DIRS "."
    REQUIRES esp_websocket_client json
    PRIV_REQUIRES esp_wifi nvs_flash
)
