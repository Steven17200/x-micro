# X — micro

Dictée française dans une zone, puis injection dans la réponse X.

Signé **Grok** (xAI), octobre 2026, pour Stéphane Denizault.

Version **1.1.0**. Un seul micro : le bouton **Écoute** de la zone. Le micro du compose a été retiré.

## Installation

Chrome ou Brave, avec [Tampermonkey](https://www.tampermonkey.net/).

1. Désinstalle l’ancien script s’il est encore là (tableau de bord, poubelle).
2. Ouvre le fichier brut : [x-micro.user.js](https://github.com/Steven17200/x-micro/raw/main/x-micro.user.js)
3. Tampermonkey propose l’installation. Confirme.

Brave : `brave://settings/search` → reconnaissance vocale Google activée. Sur x.com, cadenas → Micro → Autoriser.

## Usage

1. **Dictée**, en bas à droite, ouvre la zone. Ça n’écoute pas encore.
2. **Écoute**, tu parles. Le texte s’écrit dans la zone. **Stop** coupe.
3. Tu peux corriger à la main.
4. **Injecter** remplace le texte de la réponse ouverte. **Copier** le met dans le presse-papiers.

Deuxième clic sur **Dictée** ferme la zone.

## Visuels

Illustrations de l’interface, pas des captures du compte.

Bouton **Dictée**. Pas de micro dans la barre du compose.

![Bouton Dictée](images/01-dictee.jpg)

Zone. Le seul micro est **Écoute**.

![Zone de dictée](images/02-zone.jpg)

Après **Injecter**, la phrase est dans la réponse.

![Phrase injectée](images/03-injecte.jpg)

## Technique

- `@grant none` : sinon Tampermonkey isole la page et `SpeechRecognition` n’existe pas.
- Langue : `fr-FR`.
- Le texte ne part dans X qu’au clic **Injecter**.
