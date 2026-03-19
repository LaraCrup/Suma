<template>
    <DefaultSection>
        <div class="w-full flex flex-col gap-3">
            <div class="w-full flex items-center gap-3">
                <NavigationBackArrow class="!w-fit" color="text-gray" />
                <div class="w-full flex items-center gap-3">
                    <div class="w-8 h-8 flex items-center justify-center bg-green-dark rounded-full overflow-hidden">
                        <img src="" alt="">
                    </div>
                    <div class="h-full flex flex-col justify-between">
                        <h1 class="text-sm text-dark">Run club</h1>
                        <p class="text-[0.625rem] text-green-dark">8 participantes</p>
                    </div>
                </div>
            </div>
            <div class="w-full">
                <HabitsCommunityCard></HabitsCommunityCard>
            </div>
        </div>
        <div class="relative w-full h-[60vh] flex flex-col justify-end gap-2 overflow-y-hidden">
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatOutputMessage></CommunityChatOutputMessage>
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatOutputMessage></CommunityChatOutputMessage>
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatOutputMessage></CommunityChatOutputMessage>
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatOutputMessage></CommunityChatOutputMessage>
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatInputMessage></CommunityChatInputMessage>
            <CommunityChatOutputMessage></CommunityChatOutputMessage>
            <div class="absolute top-0 left-0 h-[60vh] w-full bg-[linear-gradient(180deg,_rgba(243,252,247,1)_0%,rgba(243,252,247,0)_12%)]"></div>
        </div>
        <form action="" class="relative w-full">
            <input type="text" placeholder="Escribí acá..." class="w-full h-11 bg-midlight text-sm text-dark focus:outline-none rounded-lg border-[1px] border-solid border-gray px-3 py-2 pr-12" />
            <button type="submit" class="w-7 h-7 absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-primary rounded-full">
                <img src="/images/icons/send.svg" alt="Enviar" class="w-3 h-3">
            </button>
        </form>
    </DefaultSection>
</template>