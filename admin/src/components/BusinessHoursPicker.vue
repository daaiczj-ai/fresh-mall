<template>
  <div class="business-hours-picker">
    <div class="display">{{ displayText }}</div>
    <el-slider
      v-model="range"
      range
      :min="0"
      :max="1440"
      :step="30"
      :format-tooltip="formatTooltip"
      :marks="marks"
      @change="emitValue"
    />
    <div class="labels">
      <span>00:00</span>
      <span>06:00</span>
      <span>12:00</span>
      <span>18:00</span>
      <span>24:00</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '08:00-21:00' }
});

const emit = defineEmits(['update:modelValue']);

const marks = {
  0: '0',
  360: '6',
  720: '12',
  1080: '18',
  1440: '24'
};

function parseHours(value) {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return [8 * 60, 21 * 60];
  const start = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const end = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
  if (end <= start) return [8 * 60, 21 * 60];
  return [start, end];
}

function toText([start, end]) {
  const fmt = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  };
  return `${fmt(start)}-${fmt(end)}`;
}

const range = ref(parseHours(props.modelValue));

watch(() => props.modelValue, (val) => {
  range.value = parseHours(val);
});

const displayText = computed(() => toText(range.value));

function formatTooltip(val) {
  const h = String(Math.floor(val / 60)).padStart(2, '0');
  const m = String(val % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function emitValue() {
  const [start, end] = range.value;
  if (end - start < 30) {
    range.value = [start, Math.min(start + 30, 1440)];
  }
  emit('update:modelValue', toText(range.value));
}
</script>

<style scoped>
.business-hours-picker { width: 100%; padding: 8px 8px 0; }
.display {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #2ECC71;
  margin-bottom: 16px;
}
.labels {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
  margin-top: 8px;
  padding: 0 4px;
}
</style>
