#ifndef HARDWARE_CONTROL_H
#define HARDWARE_CONTROL_H

//#define MACHINE_ID "676697a3332458612824dca2"

#include "esp_err.h"
#include <stdbool.h>  // Add this line

void hardware_init(void);
void update_lock_state(bool locked);
void update_lcd_status(const char* status);

#endif