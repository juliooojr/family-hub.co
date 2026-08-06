# Loaders arquivados

`LegacyFamilyHubLoadingMark.tsx` preserva o loader anterior `F -> ponto -> H`.

O loader oficial atual é a casa animada renderizada por `FamilyHubLoadingMark.tsx`. Para restaurar a versão anterior, importe `LegacyFamilyHubLoadingMark` no componente oficial e substitua `<HouseLoadingMark />` por `<LegacyFamilyHubLoadingMark />`.

Os estilos legados `app-loading-logo` e `appLoaderFluid*` permanecem em `globals.css` para permitir a restauração sem reconstruir a animação.
