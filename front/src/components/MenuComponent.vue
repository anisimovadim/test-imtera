<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const nameAccount = ref('Название аккаунта ')
const tagTitle = ref('Отзывы')

const isMobile = ref(window.innerWidth < 955)

const handleResize = () => {
  isMobile.value = window.innerWidth < 955
  activeSideBar.value = !isMobile.value
}

const activeSideBar = ref(!isMobile.value)

const onClickBurger = () => {
  activeSideBar.value = true
}
const closeMenu = () => {

  if (isMobile.value){
    activeSideBar.value = false;
  }
};
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="burger" @click="onClickBurger" v-if="!activeSideBar && isMobile">
    <span></span>
    <span></span>
    <span></span>
  </div>
  <transition :name="isMobile ? 'slide-menu' : ''">
    <div class="overlay" v-if="activeSideBar" @click="closeMenu">
      <div class="menu" v-if="activeSideBar" @click.stop>
        <div class="menu__logo">
          <img class="menu__logo-image" src="@/assets/logo.svg" alt="логотип" />
        </div>

        <div class="menu__account-name">
          {{ nameAccount }}
        </div>

        <div class="menu__tag">
          <div class="menu__tag-icon">
            <img
              class="menu__tag-img"
              src="@/components/icons/repair_tool.svg"
              alt="иконка инструментов"
            />
          </div>
          <div class="menu__tag-title">
            {{ tagTitle }}
          </div>
        </div>

        <nav class="menu__nav">
          <ul class="menu__list">
            <li class="menu__item">
              <router-link @click="closeMenu" class="menu__link" to="/comments" active-class="menu__link--active"
                >Отзывы</router-link
              >
            </li>
            <li class="menu__item">
              <router-link @click="closeMenu" class="menu__link" to="/" active-class="menu__link--active"
                >Настройка</router-link
              >
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </transition>
</template>
