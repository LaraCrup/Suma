<template>
    <DefaultSection>
        <div class="w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit text-gray" />
            <HeadingH1>Agregar Amigos</HeadingH1>
        </div>
        <form class="w-full flex flex-col gap-2">
            <FormLabel id="searchFriends" class="sr-only">Buscá por nombre de usuario</FormLabel>

            <div class="relative w-full">
                <input ref="inputElement" id="searchFriends" type="text" placeholder="Buscá por nombre de usuario"
                    class="w-full bg-light border border-primary rounded-full outline-none text-dark text-xs placeholder:text-gray placeholder:text-xs py-3 px-5 pl-9" />
                <NuxtImg src="/images/icons/search.svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3" />
            </div>
        </form>
        <div class="w-full flex flex-col gap-2">
            <CommunityFriendsCardAdd />
            <CommunityFriendsCardAdd />
            <CommunityFriendsCardAdd />
            <CommunityFriendsCardAdd />
        </div>

    </DefaultSection>
</template>