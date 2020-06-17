# Révision des routes de l'application Moovybox

## Visiteur

| Méthode | URL | Vérifiée | Notes |
|---|---|---|---|
|`POST`|`/signup`| oui |---|
|`POST`|`/signin`| oui |---|
|`POST`|`/signout`| oui |---|
|`GET`|`/confirmation/:token`| oui |lien de confirmation de compte|
|`GET`|`/reset-token`| oui | renouvellement de lien de confirmation|
|`PUT`|`/profile/reset-token`| oui | Réinit. du mot de passe |
|`GET`|`/profile/reset-password/:token`| ??? |**Doit renvoyer vers le front**|

## Profile

|Actions| Méthode | URL | Vérifiée | Notes |
|---|---|---|---|---|
||`PUT`|`/profile/pseudo`| oui |---|
||`POST`|`/profile/email`| oui |---|
||`GET`|`/profile/confirm-email-update/:token`| oui |---|
||`GET`|`/profile/confirm-new-email-update/:token`| oui |---|
||`POST`|`/profile/password`| oui | confirmation par mail ok|
||`DELETE`|`/profile`| oui |---|

## Déménagement

| Action | Méthode | URL | Vérifiée |
|---|---|---|---|
|Obtenir tous les déménagement de l'utilisateur|`GET`|`/move`| oui |
|Créer un déménagement |`POST`|`/move`| oui |
|Obtenir la liste des cartons d'un dém. |`GET`|`/move/:id`| oui |
|Modifier les paramètres d'un déménagement |`PUT`|`/move/:id`| oui |
| Supprimer un dém. |`DELETE`|`/move/:id`| oui |

## Carton

| Actions | Méthode | URL | Vérifiée |
|---|---|---|---|
|Obtenir la liste de tous les cartons de l'utilisateur |`GET`|`/box`| oui |
| Créer un carton dans un déménagement|`POST`|`/box`| oui |
| Obtenir la liste du contenu d'un carton |`GET`|`/box/:id`| oui |
| Modifier les paramètres d'un carton|`PUT`|`/box/:id`| oui |
| Supprimer un carton |`DELETE`|`/box/:id`| oui  |

## Contenu

| Actions | Méthode | URL | Vérifiée |
|---|---|---|---|
| Ajouter un objet à une boite |`POST`|`/item`| oui |
| Modifier un objet |`PUT`|`/item/:id`|oui |
| Supprimer un objet |`DELETE`|`/item/:id`|oui |

## Recherche

| Action | Méthode | URL | Vérifiée |
|---|---|---|---|
| Rechercher du contenu/des cartons | `GET` | `/search` |  |
