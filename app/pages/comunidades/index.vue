<template>
    <DefaultSection class="!gap-3">
        <div class="w-full flex justify-between items-center">
            <HeadingH1>Mis Comunidades</HeadingH1>
            <button class="w-6 h-6 flex items-center justify-center bg-accent text-green-dark font-bold rounded-full">+</button>
        </div>
        <div class="w-full flex flex-col gap-2">
            <CommunityCard />
            <CommunityCard />
            <CommunityCard />
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-3">
        <div class="w-full flex justify-between items-center">
            <HeadingH1>Mis amigos</HeadingH1>
            <button class="w-6 h-6 flex items-center justify-center bg-accent text-green-dark font-bold rounded-full">+</button>
        </div>
        <div class="w-full flex flex-col gap-2">
            <p class="text-[0.625rem] text-dark font-bold">Pendientes</p>
            <CommunityFriendsRequest />
        </div>
        <div class="w-full flex flex-col gap-2">
            <CommunityFriendsCard />
            <CommunityFriendsCard />
            <CommunityFriendsCard />
            <CommunityFriendsCard />
            <CommunityFriendsCard />
        </div>
    </DefaultSection>
    <CommunityFriendsAdd />
</template>