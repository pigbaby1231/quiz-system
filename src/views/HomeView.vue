<script setup>
import { onMounted } from 'vue'
import { useBanksStore } from '../stores/banks'

const banks = useBanksStore()
onMounted(() => banks.load())

async function removeBank(bank) {
  if (confirm(`確定刪除題庫「${bank.name}」？題目與作答紀錄都會一併刪除。`)) {
    await banks.remove(bank.id)
  }
}
</script>

<template>
  <h1>我的題庫</h1>

  <div v-if="banks.loaded && banks.banks.length === 0" class="card empty">
    <p>還沒有題庫。先匯入一份開始刷題吧！</p>
    <RouterLink to="/import" class="btn btn-primary">匯入題庫</RouterLink>
  </div>

  <div v-for="bank in banks.banks" :key="bank.id" class="card bank">
    <div class="bank-info">
      <h2>{{ bank.name }}</h2>
      <p class="muted">
        共 {{ bank.total }} 題（單選 {{ bank.singleCount }}・多選 {{ bank.multiCount }}）
      </p>
      <p v-if="bank.tags.length">
        <span v-for="t in bank.tags" :key="t" class="tag">{{ t }}</span>
      </p>
    </div>
    <div class="bank-actions">
      <RouterLink :to="`/setup/${bank.id}`" class="btn btn-primary">出題</RouterLink>
      <button class="btn btn-danger" @click="removeBank(bank)">刪除</button>
    </div>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 2.5rem 1rem;
}
.bank {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.bank h2 {
  margin: 0 0 0.2rem;
}
.bank p {
  margin: 0.2rem 0;
}
.bank-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
