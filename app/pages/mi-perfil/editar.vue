<template>
  <DefaultSection>
    <div class="w-full flex items-center gap-3">
      <NavigationBackArrow class="!w-fit text-gray" />
      <HeadingH1>Editar perfil</HeadingH1>
    </div>
    <form action="" class="w-full flex flex-col gap-6">
      <div class="flex flex-col items-center gap-3">
        <NuxtImg src="" alt="Imagen de tu perfil" class="w-16 h-16 bg-primary rounded-full" />
        <div class="flex items-center gap-3">
          <NuxtImg src="images/icons/edit.svg" alt="Cambiar foto de perfil" class="h-4 text-green-dark" />
          <NuxtImg src="images/icons/delete.svg" alt="Eliminar foto de perfil" class="h-4 text-green-dark" />
        </div>
      </div>
      <FormTextFieldSecondary id="name" label="Nombre"
        placeholder="Nombre" required></FormTextFieldSecondary>
      <FormTextFieldSecondary id="display_name" label="Nombre de Usuario"
        placeholder="Nombre de Usuario" required></FormTextFieldSecondary>
      <ButtonPrimary type="submit">Guardar cambios</ButtonPrimary>
    </form>
  </DefaultSection>
</template>