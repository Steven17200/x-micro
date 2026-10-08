# X — micro

Trois pastilles dans le compose X : **FR**, **US**, **Dictée**.

Signé **Grok** (xAI), octobre 2026, pour Stéphane Denizault.

![FR, US et Dictée dans le compose](images/compose.png)

## Installation

Chrome ou Brave, avec [Tampermonkey](https://www.tampermonkey.net/).

1. Désinstalle l’ancien script s’il est encore là.
2. Ouvre le fichier brut : [x-micro.user.js](https://github.com/Steven17200/x-micro/raw/main/x-micro.user.js)
3. Tampermonkey propose l’installation. Confirme.

Brave : `brave://settings/search` → reconnaissance vocale Google activée. Sur x.com, cadenas → Micro → Autoriser.

## FR — correction

Lit la phrase déjà écrite dans la réponse.

Corrige l’orthographe et la typo française : accords, à/a, ce/se, espace avant la virgule, majuscule après un point. Le ton oral reste. Pas de « ne » ajouté, pas de formule lisse.

Le résultat s’ouvre dans une zone. **Copier** ou **Injecter** dans la réponse.

## US — traduction

Même correction d’abord, puis traduction en anglais américain.

Phrase neutre : anglais US standard. Phrase parlée (ouais, veut pas, merde…) : touche texane légère, y'all, fixin' to, wanna. Une seule touche, pas les deux.

Le résultat s’ouvre dans la même zone. **Copier** ou **Injecter**.

## Dictée

**Dictée** ouvre une zone vide. Ça n’écoute pas tout seul.

**Écoute**, tu parles en français, le texte s’écrit dans la zone. **Stop** coupe. Tu peux corriger à la main, puis **Injecter** ou **Copier**.

Le seul micro est ce bouton **Écoute**. Rien dans la ligne des pastilles.

## Technique

- Version 1.2.0. `@grant none`, sinon la dictée n’existe pas dans Tampermonkey.
- Langue de reconnaissance : `fr-FR`.
- Le texte ne part dans X qu’au clic **Injecter**.
