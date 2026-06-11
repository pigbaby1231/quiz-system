<script setup>
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <RouterLink to="/" class="brand">📚 刷題系統</RouterLink>
      <nav>
        <RouterLink to="/">首頁</RouterLink>
        <RouterLink to="/import">匯入題庫</RouterLink>
      </nav>
    </div>
  </header>
  <main class="container">
    <RouterView />
  </main>
</template>

<style scoped>
.topbar {
  background: #1f2937;
  color: #fff;
}
.topbar-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0.7rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  text-decoration: none;
}
nav a {
  color: #d1d5db;
  text-decoration: none;
  margin-left: 1.2rem;
}
nav a.router-link-active {
  color: #fff;
  font-weight: 600;
}
.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 1.2rem 1rem 3rem;
}
</style>
