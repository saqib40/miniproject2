#ifndef WIFI_INIT_H
#define WIFI_INIT_H

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"

void wifi_init_sta(void);

#endif // WIFI_INIT_H