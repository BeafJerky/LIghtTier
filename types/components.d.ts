declare module 'vue' {
  export interface GlobalComponents {
    Icon: (typeof import('../src/components/Icon/index'))['Icon']
  }
}

export {}
