import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ImportView from './views/ImportView.vue'
import SetupView from './views/SetupView.vue'
import QuizView from './views/QuizView.vue'
import ResultView from './views/ResultView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/import', component: ImportView },
    { path: '/setup/:bankId', component: SetupView, props: true },
    { path: '/quiz', component: QuizView },
    { path: '/result', component: ResultView }
  ]
})
