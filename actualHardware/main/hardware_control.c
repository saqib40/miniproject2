#include "hardware_control.h"
#include "config.h"
//#include "driver/mcpwm_prelude.h"  // Update to new MCPWM driver
#include "driver/mcpwm.h"            // depracated move to above one if it doesn't work
#include "driver/gpio.h"
#include "driver/i2c.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define SERVO_LOCKED_ANGLE    180  // Fully locked position
#define SERVO_UNLOCKED_ANGLE  0    // Fully unlocked position
#define SERVO_PIN            18    // From your config.h
#define LCD_ADDR             0x27
#define I2C_PORT             I2C_NUM_0

static const char *TAG = "HARDWARE";

// Function prototypes
static void lcd_send_cmd(uint8_t cmd);
static void lcd_send_data(uint8_t data);
static void lcd_clear(void);
static void lcd_write_string(const char* str);

// LCD function implementations
static void lcd_init(void) {
    vTaskDelay(pdMS_TO_TICKS(50));  // Wait for LCD to power up
    
    // Initialize LCD in 4-bit mode
    lcd_send_cmd(0x33);
    lcd_send_cmd(0x32);
    lcd_send_cmd(0x28);  // 2-line display
    lcd_send_cmd(0x0C);  // Display ON, cursor OFF
    lcd_send_cmd(0x06);  // Auto increment cursor
    lcd_send_cmd(0x01);  // Clear display
    
    vTaskDelay(pdMS_TO_TICKS(2));
}

static void lcd_send_cmd(uint8_t cmd) {
    uint8_t data_u, data_l;
    data_u = cmd & 0xf0;
    data_l = (cmd << 4) & 0xf0;
    
    uint8_t data[4];
    data[0] = data_u | 0x0C;  // Enable pulse with RS=0
    data[1] = data_u | 0x08;  // Enable down with RS=0
    data[2] = data_l | 0x0C;
    data[3] = data_l | 0x08;
    
    i2c_master_write_to_device(I2C_PORT, LCD_ADDR, data, 4, 1000 / portTICK_PERIOD_MS);
}

static void lcd_send_data(uint8_t data) {
    uint8_t data_u, data_l;
    data_u = data & 0xf0;
    data_l = (data << 4) & 0xf0;
    
    uint8_t data_arr[4];
    data_arr[0] = data_u | 0x0D;  // Enable pulse with RS=1
    data_arr[1] = data_u | 0x09;  // Enable down with RS=1
    data_arr[2] = data_l | 0x0D;
    data_arr[3] = data_l | 0x09;
    
    i2c_master_write_to_device(I2C_PORT, LCD_ADDR, data_arr, 4, 1000 / portTICK_PERIOD_MS);
}

static void lcd_clear(void) {
    lcd_send_cmd(0x01);
    vTaskDelay(pdMS_TO_TICKS(2));
}

static void lcd_write_string(const char* str) {
    while (*str) {
        lcd_send_data(*str++);
    }
}

// Convert angle to pulse width in microseconds (uS)
static inline uint32_t angle_to_duty(int angle) {
    // Servo requires pulse between 500uS (0 degrees) and 2400uS (180 degrees)
    // Using standard formula: duty = map(angle, 0, 180, 500, 2400)
    return (angle * (2400 - 500) / 180) + 500;
}

static void servo_init(void) {
    ESP_LOGI(TAG, "Initializing servo motor on pin %d", SERVO_PIN);
    
    // MCPWM Configuration
    mcpwm_gpio_init(MCPWM_UNIT_0, MCPWM0A, SERVO_PIN);
    
    mcpwm_config_t pwm_config = {
        .frequency = 50,    // 50Hz frequency = 20ms period
        .cmpr_a = 0,       // Initial duty cycle 0
        .counter_mode = MCPWM_UP_COUNTER,
        .duty_mode = MCPWM_DUTY_MODE_0
    };
    
    mcpwm_init(MCPWM_UNIT_0, MCPWM_TIMER_0, &pwm_config);
    ESP_LOGI(TAG, "Servo initialization complete");
}

static void servo_set_angle(int angle) {
    // Constrain angle between 0-180 degrees
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    
    uint32_t duty_us = angle_to_duty(angle);
    ESP_LOGI(TAG, "Setting servo angle to %d degrees (pulse width: %ld us)", angle, duty_us);
    
    // Convert microseconds to duty cycle percentage (1 duty = 100%)
    float duty_percent = (float)duty_us / 20000.0 * 100.0;
    
    mcpwm_set_duty(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_A, duty_percent);
    mcpwm_set_duty_type(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_A, MCPWM_DUTY_MODE_0);
}

void hardware_init(void) {
    // Initialize I2C for LCD
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = LCD_SDA_PIN,
        .scl_io_num = LCD_SCL_PIN,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = 100000
    };
    
    ESP_ERROR_CHECK(i2c_param_config(I2C_PORT, &conf));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_PORT, conf.mode, 0, 0, 0));
    
    // Initialize LCD
    lcd_init();
    
    // Initialize Servo
    servo_init();
    
    ESP_LOGI(TAG, "Hardware initialized successfully");
}

void update_lock_state(bool locked) {
    ESP_LOGI(TAG, "Updating lock state: %s", locked ? "LOCKED" : "UNLOCKED");
    servo_set_angle(locked ? SERVO_LOCKED_ANGLE : SERVO_UNLOCKED_ANGLE);
    update_lcd_status(locked ? "LOCKED" : "UNLOCKED");
}

void update_lcd_status(const char* status) {
    ESP_LOGI(TAG, "Updating LCD with status: %s", status);
    lcd_clear();
    lcd_send_cmd(0x80); // Move to first line
    lcd_write_string("Status:");
    lcd_send_cmd(0xC0); // Move to second line
    lcd_write_string(status);
}
