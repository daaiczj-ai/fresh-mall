<template>
  <div>
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="item in stats" :key="item.label">
        <el-card shadow="hover"><div class="stat-item"><div class="stat-value">{{ item.value }}</div><div class="stat-label">{{ item.label }}</div></div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="16">
        <el-card header="近7日营业数据">
          <div ref="chartRef" style="height:350px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card header="热销商品 TOP10">
          <div v-for="(item, i) in data.hotProducts" :key="i" class="hot-item">
            <span class="rank">{{ i + 1 }}</span>
            <span class="name">{{ item.product_name }}</span>
            <span class="sold">{{ item.totalSold }}件</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import request from '../utils/request';

const data = ref({ hotProducts: [], recent7Days: [] });
const chartRef = ref();
const stats = ref([]);

onMounted(async () => {
  data.value = await request.get('/dashboard');
  stats.value = [
    { label: '今日订单', value: data.value.todayOrders },
    { label: '今日营业额', value: '¥' + data.value.todayRevenue },
    { label: '总用户数', value: data.value.totalUsers },
    { label: '待处理订单', value: data.value.pendingOrders }
  ];
  initChart();
});

function initChart() {
  const chart = echarts.init(chartRef.value);
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '营业额'] },
    xAxis: { type: 'category', data: data.value.recent7Days.map(d => d.date) },
    yAxis: [{ type: 'value', name: '订单' }, { type: 'value', name: '金额' }],
    series: [
      { name: '订单量', type: 'bar', data: data.value.recent7Days.map(d => d.orders), itemStyle: { color: '#2ECC71' } },
      { name: '营业额', type: 'line', yAxisIndex: 1, data: data.value.recent7Days.map(d => d.revenue), itemStyle: { color: '#E74C3C' } }
    ]
  });
}
</script>

<style scoped>
.stat-value { font-size: 28px; font-weight: bold; color: #2ECC71; }
.stat-label { color: #999; margin-top: 4px; }
.hot-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.rank { width: 24px; height: 24px; background: #2ECC71; color: #fff; border-radius: 4px; text-align: center; line-height: 24px; font-size: 12px; margin-right: 12px; }
.name { flex: 1; }
.sold { color: #999; }
</style>
