<script lang="ts">
  let { label, value, detail = '' }: { label: string; value: string | number; detail?: string } = $props();
</script>

<div class="statCard">
  <span>{label}</span>
  <b>{value}</b>
  {#if detail}
    <div class="small">{detail}</div>
  {/if}
</div>
