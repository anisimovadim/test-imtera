<script setup>
import axios from '@/api.js';
import {onMounted, ref} from "vue";
import {parseYandexReviews} from "@/services/yandexParser.js";
import router from "@/router/index.js";
const props = defineProps({
  userSetting: {
    type:Object,
  }
})
const url = ref(props.userSetting?.link || '');
const isLoading = ref(false);
const error = ref("");
const message = ref("");
const reviews = ref([]);
const rating = ref(null);
const reviewsCount = ref(0);
const emit = defineEmits(['update-user'])
const saveReviews = async () => {
  const yandexReviewRegex = /^https:\/\/yandex\.ru\/maps\/org\/[^\/]+\/\d+\/reviews\/$/;
  if (yandexReviewRegex.test(url.value)){
    error.value = "Укажите правильную ссылку, пример указан выше!";
    return;
  }
  if (!url.value) {
    error.value = "Необходимо указать ссылку!";
    return;
  }

  isLoading.value = true;
  error.value = '';
  message.value = '';
  reviews.value = [];
  rating.value = null;
  reviewsCount.value = 0;

  try {
    const { data } = await axios.post('/reviews', { url: url.value })

    if (data.error) {
      error.value = data.error;
      return;
    }
    message.value = "Ссылка активирована!";
    emit('update-user');
  } catch (e) {
    console.error('Ошибка получения отзывов:', e);
    error.value = e.response?.data?.error || "Не удалось получить отзывы!";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <h2>Подключить Яндекс</h2>
    <form @submit.prevent="saveReviews">
      <div class="form-field">
        <label for="yandexLink" class="form-field__label">
          Укажите ссылку на Яндекс, пример
          <a href="https://yandex.ru/maps/org/samoye_populyarnoye_kafe/1010501395/reviews/" target="_blank">
            https://yandex.ru/maps/org/samoye_populyarnoye_kafe/1010501395/reviews/
          </a>
        </label>
        <input
          type="text"
          class="form-field__input"
          id="yandexLink"
          placeholder="https://yandex.ru/maps/org/samoye_populyarnoye_kafe/1010501395/reviews/"
          v-model="url"
        />
        <div class="error" v-if="error">{{error}}</div>
        <div class="message" v-if="message">{{message}}</div>
        <button class="form-field__btn" :disabled="isLoading">{{isLoading ? "Подождите..." : "Сохранить"}}</button>
      </div>
    </form>
  </div>
</template>
