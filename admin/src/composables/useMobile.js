import { ref, onMounted, onUnmounted } from 'vue';

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const isMobile = ref(false);

  function update() {
    isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT;
    document.body.classList.toggle('admin-mobile', isMobile.value);
  }

  onMounted(() => {
    update();
    window.addEventListener('resize', update);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', update);
    document.body.classList.remove('admin-mobile');
  });

  return { isMobile };
}
