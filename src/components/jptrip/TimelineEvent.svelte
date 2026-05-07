<script lang="ts">
  export let event: any;
</script>

<div class="relative pl-7 mb-6">
  <!-- Line -->
  <div class="absolute left-[5px] top-4 bottom-[-24px] w-[1px] bg-slate-200"></div>
  
  <!-- Dot -->
  <div class="absolute left-[-1px] top-1.5 w-[13px] h-[13px] rounded-full border-[1.5px] z-10
    {event.type === 'place' ? 'bg-white border-slate-800' :
     event.type === 'food' ? 'bg-red-600 border-red-600' :
     event.type === 'hotel' ? 'bg-emerald-700 border-emerald-700' :
     'bg-slate-50 border-slate-400'}"></div>
     
  <!-- Content -->
  {#if event.time}
    <div class="text-[11px] text-slate-500 mb-1">{event.time}</div>
  {/if}
  <div class="text-[15px] font-medium mb-1 leading-snug">
    {@html event.title}
    {#if event.jp}
      <span class="text-[12px] font-normal text-slate-500 ml-1 font-serif">{event.jp}</span>
    {/if}
  </div>
  
  {#if event.desc}
    <div class="text-[13px] text-slate-700 leading-relaxed mb-1.5">
      {@html event.desc}
    </div>
  {/if}
  
  {#if event.badges || event.links}
    <div class="flex flex-wrap gap-1.5 mt-1.5 items-center">
      {#each event.badges || [] as badge}
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap
          {badge.type === 'train' ? 'bg-blue-50 text-blue-800' :
           badge.type === 'bus' ? 'bg-amber-50 text-amber-800' :
           badge.type === 'walk' ? 'bg-emerald-50 text-emerald-800' :
           'bg-slate-100 text-slate-700'}">
           {#if badge.icon} <i class="ti {badge.icon}"></i> {/if}
           {badge.text}
        </span>
      {/each}
      
      {#each event.links || [] as link}
        <a href={link.href} target="_blank" rel="noopener noreferrer" 
           class="inline-flex items-center gap-1 text-[12px] text-red-600 hover:text-red-700 hover:underline whitespace-nowrap">
          {#if link.icon} <i class="ti {link.icon}"></i> {/if}
          {link.text}
        </a>
      {/each}
    </div>
  {/if}
  
  {#if event.box}
    <div class="rounded-lg px-3 py-2.5 text-[12.5px] leading-relaxed mt-2 flex gap-2 items-start
      {event.box.type === 'tip' ? 'bg-amber-50 text-amber-900' :
       event.box.type === 'warn' ? 'bg-red-50 text-red-800' :
       'bg-blue-50 text-blue-800'}">
      <i class="ti {event.box.icon} mt-[2px] shrink-0 text-[14px]"></i>
      <div>{@html event.box.text}</div>
    </div>
  {/if}
</div>
