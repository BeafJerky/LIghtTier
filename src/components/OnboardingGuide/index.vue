<template>
  <div class="og-overlay">
    <div class="og-card">
      <!-- 步骤内容 -->
      <Transition name="og-step" mode="out-in">
        <div :key="step" class="og-body">
          <!-- 第 1 步：欢迎 -->
          <div v-if="step === 1" class="og-welcome">
            <div class="og-logo">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              >
                <circle cx="6" cy="6" r="2.6" />
                <circle cx="18" cy="6" r="2.6" />
                <circle cx="12" cy="18" r="2.6" />
                <path d="M8.4 7.3l3.3 8.3M15.6 7.3l-3.3 8.3" />
              </svg>
            </div>
            <h2 class="og-title">{{ t('newOnboarding.welcomeTitle') }}</h2>
            <p class="og-desc">{{ t('newOnboarding.welcomeDesc') }}</p>
          </div>

          <!-- 第 2 步：核心功能简介 -->
          <div v-else-if="step === 2" class="og-features">
            <h2 class="og-title">{{ t('newOnboarding.featuresTitle') }}</h2>
            <p class="og-sub">{{ t('newOnboarding.featuresDesc') }}</p>
            <div class="og-feature-grid">
              <div v-for="f in features" :key="f.title" class="og-feature">
                <div class="og-feature-icon" v-html="f.icon"></div>
                <div class="og-feature-text">
                  <div class="og-feature-title">{{ f.title }}</div>
                  <div class="og-feature-desc">{{ f.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 第 3 步：安装核心（Android 内核编译期内置，仅展示说明） -->
          <div v-else-if="step === 3" class="og-install">
            <div class="og-badge">{{ BUILTIN_CORE_VERSION }}</div>
            <h2 class="og-title">{{
              isAndroidPlatform
                ? t('newOnboarding.androidBuiltinTitle')
                : t('newOnboarding.installTitle')
            }}</h2>
            <p class="og-desc">{{
              isAndroidPlatform
                ? t('newOnboarding.androidBuiltinDesc', { version: BUILTIN_CORE_VERSION })
                : t('newOnboarding.installDesc', { version: BUILTIN_CORE_VERSION })
            }}</p>
            <div v-if="!isAndroidPlatform" class="og-install-actions">
              <button class="og-btn og-btn-primary" :disabled="installing" @click="handleInstall">
                {{ installing ? t('newOnboarding.installing') : t('newOnboarding.installCoreBtn') }}
              </button>
              <button class="og-btn og-btn-ghost" :disabled="installing" @click="skipInstall">
                {{ t('newOnboarding.skipInstall') }}
              </button>
            </div>
          </div>

          <!-- 第 4 步：完成 -->
          <div v-else class="og-done">
            <div class="og-done-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4.5 12.5l5 5 10-11" />
              </svg>
            </div>
            <h2 class="og-title">{{ t('newOnboarding.doneTitle') }}</h2>
            <p class="og-desc">{{
              installed ? t('newOnboarding.installDoneDesc') : t('newOnboarding.skipDoneDesc')
            }}</p>
          </div>
        </div>
      </Transition>

      <!-- 底部操作区 -->
      <div class="og-footer">
        <template v-if="step < 4">
          <div class="og-dots">
            <span
              v-for="i in 4"
              :key="i"
              class="og-dot"
              :class="{ active: i === step }"
              @click="step = i"
            ></span>
          </div>
          <div class="og-footer-actions">
            <button v-if="step > 1" class="og-btn og-btn-ghost" @click="step--">
              {{ t('newOnboarding.prev') }}
            </button>
            <button class="og-btn og-btn-primary" @click="step++">
              {{ t('newOnboarding.next') }}
            </button>
          </div>
        </template>
        <template v-else>
          <label class="og-check">
            <input v-model="notShowAgain" type="checkbox" />
            <span>{{ t('newOnboarding.notShowAgain') }}</span>
          </label>
          <button class="og-btn og-btn-primary" @click="finish">
            {{ t('newOnboarding.doneBtn') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OnboardingGuide — 首次启动引导（4 步流程）
 *
 * 步骤：1 欢迎 → 2 功能简介 → 3 安装内核（Android 内核编译期内置，仅展示说明）
 * → 4 完成；第 3 步经 useCoreInstall 安装内置版本核心（免下载，可跳过）；
 * 结束时勾选“下次不再显示”则写入 localStorage（settings.onboardingDone）持久化，
 * finish 事件交由父组件控制显隐。
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BUILTIN_CORE_VERSION } from '@/constants/easytier'
import { useCoreInstall } from '@/hooks/useCoreInstall'
import { useCreamToast } from '@/hooks/useCreamToast'
import { isAndroid } from '@/utils/platformUtil'

const emit = defineEmits<{ finish: [] }>()

const { t } = useI18n()
const toast = useCreamToast()
const { installing, installCore } = useCoreInstall()

// 当前步骤（1-4），底部圆点可直达
const step = ref(1)
// Android：内核编译期内置，无需安装步骤
const isAndroidPlatform = isAndroid()
// 是否已安装核心（决定第 4 步提示文案）；Android 内核随应用内置
const installed = ref(isAndroidPlatform)
// 下次不再显示
const notShowAgain = ref(false)

// 核心功能简介（以快速上手为目标）
const features = computed(() => [
  {
    title: t('newOnboarding.feature1Title'),
    desc: t('newOnboarding.feature1Desc'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.3 7.2l3.4 8.5M15.7 7.2l-3.4 8.5"/></svg>'
  },
  {
    title: t('newOnboarding.feature2Title'),
    desc: t('newOnboarding.feature2Desc'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20V12M12 20V5M19 20v-6"/></svg>'
  },
  {
    title: t('newOnboarding.feature3Title'),
    desc: t('newOnboarding.feature3Desc'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"/></svg>'
  },
  {
    title: t('newOnboarding.feature4Title'),
    desc: t('newOnboarding.feature4Desc'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>'
  }
])

// 安装内置核心（免下载）
const handleInstall = async () => {
  const ok = await installCore(BUILTIN_CORE_VERSION)
  if (ok) {
    installed.value = true
    toast.success(t('newOnboarding.installSuccess'))
    step.value = 4
  } else {
    toast.error(t('newOnboarding.installFail'))
  }
}

// 跳过安装
const skipInstall = () => {
  installed.value = false
  step.value = 4
}

// 结束引导：勾选"下次不再显示"时持久化，否则下次打开仍显示
const finish = () => {
  if (notShowAgain.value) {
    localStorage.setItem('settings.onboardingDone', 'true')
  }
  emit('finish')
}
</script>

<style scoped>
.og-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9000;
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--theme-bg, #fdf8f4);
  justify-content: center;
  align-items: center;
}

.og-card {
  display: flex;
  flex-direction: column;
  width: 520px;
  max-width: calc(100vw - 64px);
  min-height: 380px;
  padding: 36px 40px 24px;
  background: var(--theme-bg-card, #fff);
  border: 1px solid var(--theme-border-light, #f5ede6);
  border-radius: var(--theme-radius-xl, 18px);
  box-shadow: var(--theme-shadow-md, 0 12px 36px rgb(74 55 40 / 7%));
  animation: og-card-in 0.35s var(--theme-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}

@keyframes og-card-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.og-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 步骤切换动画 */
.og-step-enter-active,
.og-step-leave-active {
  transition: all 0.25s ease;
}

.og-step-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.og-step-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

/* 第 1 步：欢迎 */
.og-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.og-logo {
  display: flex;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  color: var(--theme-accent-primary, #e8a0a0);
  background: color-mix(in srgb, var(--theme-accent-primary, #e8a0a0) 12%, transparent);
  border-radius: var(--theme-radius-round, 50%);
  align-items: center;
  justify-content: center;
}

.og-logo svg {
  width: 34px;
  height: 34px;
}

/* 第 2 步：功能简介 */
.og-features {
  width: 100%;
}

.og-features .og-title,
.og-features .og-sub {
  text-align: center;
}

.og-sub {
  margin: 0 0 22px;
  font-size: 12px;
  color: var(--theme-text-muted, #c8bdb2);
}

.og-feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.og-feature {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--theme-bg-tag, #f5ede6);
  border-radius: var(--theme-radius-md, 12px);
  align-items: flex-start;
}

.og-feature-icon {
  display: flex;
  width: 36px;
  height: 36px;
  color: var(--theme-accent-primary, #e8a0a0);
  background: color-mix(in srgb, var(--theme-accent-primary, #e8a0a0) 12%, transparent);
  border-radius: var(--theme-radius-sm, 10px);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.og-feature-icon svg {
  width: 20px;
  height: 20px;
}

.og-feature-title {
  font-family: var(--theme-font-display, 'Quicksand', sans-serif);
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-text-primary, #4a3728);
}

.og-feature-desc {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--theme-text-secondary, #7a6e5e);
}

/* 第 3 步：安装核心 */
.og-install {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.og-badge {
  padding: 5px 16px;
  margin-bottom: 16px;
  font-family: var(--theme-font-display, 'Quicksand', sans-serif);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--theme-accent-primary, #e8a0a0);
  background: color-mix(in srgb, var(--theme-accent-primary, #e8a0a0) 14%, transparent);
  border-radius: var(--theme-radius-pill, 100px);
}

.og-install-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* 第 4 步：完成 */
.og-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.og-done-icon {
  display: flex;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  color: var(--theme-color-success, #7fba8a);
  background: color-mix(in srgb, var(--theme-color-success, #7fba8a) 14%, transparent);
  border-radius: var(--theme-radius-round, 50%);
  align-items: center;
  justify-content: center;
}

.og-done-icon svg {
  width: 28px;
  height: 28px;
}

/* 通用标题与描述 */
.og-title {
  margin: 0 0 8px;
  font-family: var(--theme-font-display, 'Quicksand', sans-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-primary, #4a3728);
}

.og-desc {
  max-width: 380px;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--theme-text-secondary, #7a6e5e);
}

/* 底部操作区 */
.og-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid var(--theme-border-light, #f5ede6);
}

.og-dots {
  display: flex;
  gap: 8px;
}

.og-dot {
  width: 8px;
  height: 8px;
  cursor: pointer;
  background: var(--theme-border, #ede4db);
  border-radius: var(--theme-radius-round, 50%);
  transition: all 0.25s var(--theme-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}

.og-dot.active {
  width: 22px;
  background: var(--theme-accent-primary, #e8a0a0);
  border-radius: var(--theme-radius-pill, 100px);
}

.og-footer-actions {
  display: flex;
  gap: 10px;
}

/* 按钮 */
.og-btn {
  padding: 8px 22px;
  font-family: var(--theme-font-body, 'Sora', sans-serif);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: var(--theme-radius-pill, 100px);
  transition: all 0.2s;
}

.og-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.og-btn-primary {
  color: var(--theme-text-on-accent, #fff);
  background: var(--theme-accent-primary, #e8a0a0);
}

.og-btn-primary:hover:not(:disabled) {
  background: var(--theme-accent-hover, #d49090);
  transform: translateY(-1px);
}

.og-btn-ghost {
  color: var(--theme-text-secondary, #7a6e5e);
  background: transparent;
  border: 1px solid var(--theme-border, #ede4db);
}

.og-btn-ghost:hover:not(:disabled) {
  color: var(--theme-accent-primary, #e8a0a0);
  background: var(--theme-bg-hover, rgb(232 160 160 / 6%));
}

/* 单选框 */
.og-check {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--theme-text-secondary, #7a6e5e);
  cursor: pointer;
  user-select: none;
}

.og-check input {
  accent-color: var(--theme-accent-primary, #e8a0a0);
  cursor: pointer;
}
</style>
