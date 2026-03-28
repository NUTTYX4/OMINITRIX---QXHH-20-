/*
 * ═══════════════════════════════════════════════════════
 * ESP32 CLAP DETECTION — INMP441 I2S Microphone
 * Omnitrix Healthcare Delivery Robot (Stealth Mode)
 * ═══════════════════════════════════════════════════════
 *
 * Wiring:
 * INMP441    →  ESP32
 * ────────────────────
 * WS         →  GPIO 25
 * SCK        →  GPIO 26
 * SD         →  GPIO 27
 * L/R        →  GND (left channel)
 * VDD        →  3.3V  (CRITICAL: DO NOT USE 5V)
 * GND        →  GND
 *
 * Output:
 * Sends '1' via Serial (115200) when clap detected.
 * All debug text is commented out for final hardware integration.
 */

#include <driver/i2s.h>

// ═══════════════════════════════════════════
//  CONFIGURABLE PARAMETERS — TUNE THESE
// ═══════════════════════════════════════════

#define CLAP_THRESHOLD    2500    // Amplitude threshold for clap detection (tune: 1500–5000)
#define DEBOUNCE_MS       1500    // Ignore input for 1.5s after clap
#define SAMPLE_RATE       16000   // I2S sample rate in Hz
#define BUFFER_SIZE       512     // Number of samples per read cycle
#define I2S_PORT          I2S_NUM_0

// ═══════════════════════════════════════════
//  I2S PIN DEFINITIONS
// ═══════════════════════════════════════════

#define I2S_WS   25   // Word Select (LRCK)
#define I2S_SCK  26   // Serial Clock (BCLK)
#define I2S_SD   27   // Serial Data (DOUT)

// ═══════════════════════════════════════════
//  GLOBALS
// ═══════════════════════════════════════════

int32_t sampleBuffer[BUFFER_SIZE];
unsigned long lastClapTime = 0;

// ═══════════════════════════════════════════
//  I2S CONFIGURATION
// ═══════════════════════════════════════════

void setupI2S() {
  const i2s_config_t i2s_config = {
    .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate          = SAMPLE_RATE,
    .bits_per_sample      = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format       = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count        = 4,
    .dma_buf_len          = BUFFER_SIZE,
    .use_apll             = false,
    .tx_desc_auto_clear   = false,
    .fixed_mclk           = 0
  };

  const i2s_pin_config_t pin_config = {
    .bck_io_num   = I2S_SCK,
    .ws_io_num    = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num  = I2S_SD
  };

  // Install and configure I2S driver
  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_zero_dma_buffer(I2S_PORT);

  // Small delay for mic to stabilize
  delay(500);
}

// ═══════════════════════════════════════════
//  CALCULATE PEAK AMPLITUDE FROM BUFFER
// ═══════════════════════════════════════════

int32_t getPeakAmplitude() {
  size_t bytesRead = 0;

  // Read I2S data into buffer
  esp_err_t result = i2s_read(
    I2S_PORT,
    (void*)sampleBuffer,
    sizeof(sampleBuffer),
    &bytesRead,
    portMAX_DELAY
  );

  if (result != ESP_OK || bytesRead == 0) {
    return 0;
  }

  int samplesRead = bytesRead / sizeof(int32_t);
  int32_t peak = 0;

  // Find maximum absolute amplitude
  for (int i = 0; i < samplesRead; i++) {
    // INMP441 outputs 24-bit data left-aligned in 32-bit frame
    // Shift right by 8 to get actual 24-bit value
    int32_t sample = abs(sampleBuffer[i] >> 8);
    if (sample > peak) {
      peak = sample;
    }
  }

  return peak;
}

// ═══════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(100);

  // NOTE: Startup text is commented out for the final run 
  // to prevent confusing the Arduino over the RX/TX lines.
  /*
  Serial.println("═══════════════════════════════════════");
  Serial.println("  ESP32 Clap Detector — INMP441 I2S");
  Serial.println("  Omnitrix Healthcare Robot");
  Serial.println("═══════════════════════════════════════");
  */

  setupI2S();
}

// ═══════════════════════════════════════════
//  MAIN LOOP — FAST PROCESSING
// ═══════════════════════════════════════════

void loop() {
  // Get peak amplitude from current audio buffer
  int32_t amplitude = getPeakAmplitude();

  // ── DEBUG: Uncomment ONLY when testing while plugged into your laptop via USB ──
  // Serial.print("AMP: ");
  // Serial.println(amplitude);

  // Check if amplitude exceeds clap threshold
  if (amplitude > CLAP_THRESHOLD) {
    unsigned long now = millis();

    // Debounce: ignore if within cooldown period
    if (now - lastClapTime > DEBOUNCE_MS) {
      lastClapTime = now;

      // ═══ CLAP DETECTED — Send ONLY the '1' character to Arduino ═══
      Serial.print('1');

      // Debug output is commented out for the final run
      // Serial.print("[CLAP] Detected! Amplitude: ");
      // Serial.println(amplitude);
    }
  }
}
