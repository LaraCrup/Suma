<template>
    <AuthHeader />
    <DefaultMain class="auth-screen" :pull-to-refresh="false">
        <div class="w-full flex flex-col items-center gap-5 my-auto">
            <slot />
        </div>
    </DefaultMain>
</template>
