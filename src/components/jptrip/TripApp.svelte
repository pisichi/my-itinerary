<script lang="ts">
  import jptripData from '../../data/jptrip.json';
  import TimelineEvent from './TimelineEvent.svelte';
  
  let activeDayId = jptripData.days[0].id;
  
  $: activeDay = jptripData.days.find(d => d.id === activeDayId) || jptripData.days[0];
</script>

<div class="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans selection:bg-red-200">
  <!-- Header -->
  <header class="bg-[#1A1A1A] text-white px-6 pt-8 pb-7 relative overflow-hidden">
    <div class="absolute -right-2 -top-2 text-[120px] font-bold opacity-5 font-serif select-none pointer-events-none leading-none">日本</div>
    <!-- <div class="inline-block bg-[#C1361A] text-white text-[11px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-sm mb-3">
      {jptripData.meta.tag}
    </div> -->
    <h1 class="text-3xl sm:text-[40px] font-bold font-serif mb-2 leading-tight">
      {jptripData.meta.title}<br/>
      <span class="text-2xl sm:text-3xl">{jptripData.meta.titleJp}</span>
    </h1>
    <p class="text-sm text-white/55 mb-5">{jptripData.meta.subtitle}</p>
    
    <div class="flex flex-wrap gap-2">
      {#each jptripData.flights as flight}
        <span class="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-[12px] text-white/80">
          <i class="ti {flight.icon}"></i> {flight.text}
        </span>
      {/each}
    </div>
  </header>

  <!-- Hotels Strip -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-[#E8E5DE] border-b border-[#E8E5DE]">
    {#each jptripData.hotels as hotel}
      <div class="bg-[#FAF9F6] p-3.5 sm:px-5 sm:py-3.5 border-l-[3px] 
        {hotel.color === 'blue' ? 'border-[#1A4580]' : 
         hotel.color === 'red' ? 'border-[#C1361A]' : 'border-[#2D6A4F]'}">
        <div class="text-[11px] text-[#888] mb-[3px]">{hotel.dates}</div>
        <div class="text-[14px] font-medium mb-[2px]">{hotel.name}</div>
        <div class="text-[11px] text-[#888]">{hotel.loc}</div>
      </div>
    {/each}
  </div>

  <!-- Layout -->
  <div class="flex flex-col sm:flex-row min-h-[calc(100vh-200px)]">
    
    <!-- Navigation -->
    <nav class="flex sm:flex-col overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden bg-[#F2F0EB] sm:w-[80px] shrink-0 border-b sm:border-b-0 sm:border-r border-[#E8E5DE] sm:sticky sm:top-0 sm:h-screen scrollbar-hide">
      {#each jptripData.days as day}
        <button 
          class="flex flex-col items-center gap-0.5 px-3 py-2.5 sm:px-1.5 sm:py-2.5 border-b-2 sm:border-b-0 sm:border-l-2 transition-colors min-w-[70px] sm:min-w-0 whitespace-nowrap
                 {activeDayId === day.id ? 'bg-[#FAF9F6] border-[#C1361A] text-[#C1361A] font-medium' : 'border-transparent text-[#888] hover:bg-[#E8E5DE] hover:text-[#1A1A1A]'}"
          on:click={() => activeDayId = day.id}>
          <span class="text-[18px] font-semibold font-serif leading-none">
            {#if day.nav.icon}
              <i class="ti {day.nav.icon} text-[16px]"></i>
            {:else}
              {day.nav.num}
            {/if}
          </span>
          <span class="text-[10px] leading-[1.3] text-center whitespace-pre-line">{day.nav.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Main Content Pane -->
    <main class="flex-1 px-5 py-6 sm:px-8 sm:py-8 bg-[#FAF9F6] min-h-[500px]">
      <div class="max-w-[720px]">
        <div class="mb-[18px]">
          <h2 class="text-[22px] font-bold font-serif mb-1 text-[#1A1A1A]">{activeDay.heading.title}</h2>
          <p class="text-[13px] text-[#888]">{activeDay.heading.sub}</p>
        </div>
        
        {#if activeDay.infoBox}
          <div class="rounded-lg px-3 py-[9px] text-[12.5px] leading-[1.55] mb-[18px] flex gap-[7px] items-start
            {activeDay.infoBox.type === 'tip' ? 'bg-[#FDF3E3] text-[#92500A]' :
             activeDay.infoBox.type === 'warn' ? 'bg-[#F9EDE9] text-[#C1361A]' :
             'bg-[#E8EEF9] text-[#1A4580]'}">
            <i class="ti {activeDay.infoBox.icon} mt-[1px] shrink-0 text-[14px]"></i>
            <div>{@html activeDay.infoBox.text}</div>
          </div>
        {/if}

        <div class="mt-4">
          {#each activeDay.events as event}
            <TimelineEvent {event} />
          {/each}
        </div>
        
        {#if activeDay.costs && activeDay.costs.length > 0}
          <div class="bg-[#F2F0EB] rounded-lg px-3.5 py-3 mt-5">
            <h4 class="text-[10px] font-medium tracking-[.08em] uppercase text-[#888] mb-2">Estimated costs</h4>
            <div class="flex flex-col">
              {#each activeDay.costs as cost}
                <div class="flex justify-between text-[13px] border-b border-[#E8E5DE] py-1 last:border-0">
                  <span class="text-[#444]">{cost.label}</span>
                  <span class="{cost ? 'font-bold' : 'font-medium'} text-[#1A1A1A]">{cost.value}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if activeDay.tips && activeDay.tips.length > 0}
          <div class="mt-6">
            <div class="text-[10px] font-medium tracking-[.1em] uppercase text-[#888] my-6 flex items-center gap-2 after:content-[''] after:flex-1 after:h-[1px] after:bg-[#E8E5DE]">
              All friend tips at a glance
            </div>
            <div class="flex flex-col gap-2">
              {#each activeDay.tips as tip}
                <div class="rounded-lg px-3 py-[9px] text-[12.5px] leading-[1.55] flex gap-[7px] items-start
                  {tip.type === 'warn' ? 'bg-[#F9EDE9] text-[#C1361A]' : 'bg-[#FDF3E3] text-[#92500A]'}">
                  <i class="ti {tip.icon} mt-[1px] shrink-0 text-[14px]"></i>
                  <div>{@html tip.text}</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </main>
  </div>
</div>

<style>
  /* Hide scrollbar for nav but keep functionality */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>