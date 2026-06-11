<script lang="ts">
  import { toastState } from '$lib/stores/toast.svelte';
</script>

<div
  id="toast"
  class:show={toastState.visible}
  class:good={toastState.type === 'good'}
  class:bad={toastState.type === 'bad'}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {toastState.message}
</div>
