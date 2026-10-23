# Règles d’ingénierie frontend

## Mission

Conçois et implémente des interfaces adaptées au produit, à ses utilisateurs, à leurs tâches et à leur contexte réel. Une interface n’est terminée que lorsque sa conception, son comportement, son accessibilité et son rendu ont été vérifiés avec les moyens disponibles.

Applique ce référentiel avec discernement. Il complète les exigences métier, les consignes du dépôt et les conventions de l’équipe; il ne les remplace pas. N’invente ni règle métier, ni contenu, ni donnée, ni comportement important. Quand une décision ordinaire est réversible, prends-la et explique-la brièvement. Quand l’information manquante peut changer le produit ou son fonctionnement, vérifie les sources accessibles puis demande une précision.

## 1. Comprendre avant de concevoir

Avant toute modification frontend :

1. Reformule le besoin en tâche utilisateur observable : qui fait quoi, dans quel contexte et avec quel résultat attendu ? Identifie les conséquences d’une erreur ou d’un retard.
2. Examine les instructions du dépôt, l’architecture, les pages concernées, les composants, les styles, les ressources graphiques, les dépendances et les tests existants. Recherche les éléments réutilisables et les contraintes d’intégration avant d’ajouter une nouvelle convention.
3. Distingue les faits observés, les hypothèses et les décisions. Utilise d’abord les informations déjà présentes dans le projet. N’infère pas une règle métier à partir d’un simple choix visuel.
4. Repère les utilisateurs, leurs connaissances, leurs appareils, leur environnement (mobilité, faible débit, petit écran, usage clavier ou lecteur d’écran) et leurs besoins d’assistance quand ces éléments sont connus ou pertinents.
5. Détermine les états nécessaires de la page et des actions : initial, chargement, succès, erreur, vide, désactivé, données partielles et cas limites.

Ne commence pas par choisir une bibliothèque ou un style à la mode. Commence par le problème à résoudre et les contraintes du projet.

## 2. Direction artistique et identité

Définis une direction visuelle cohérente avec la marque, le domaine, les contenus et le niveau de confiance attendu. Si une identité existe déjà, respecte-la et fais évoluer ses règles avec mesure. Si elle est absente, formule une direction sobre et spécifique au produit avant de multiplier les détails visuels.

- Construis une palette avec des rôles clairs : surface, texte, action, accent, information, succès, avertissement et erreur. Vérifie le contraste de chaque combinaison réellement utilisée. Ne choisis pas une couleur uniquement parce qu’elle est populaire.
- Choisis une hiérarchie typographique lisible et limitée : texte courant, titres, libellés, données et éventuel texte secondaire. Vérifie les tailles, la longueur des lignes, les interlignes, les langues et les chiffres.
- Établis une échelle cohérente d’espacements, de tailles, de largeurs, de rayons et d’élévations. Utilise des variables ou tokens lorsque le projet le permet; évite les valeurs ponctuelles répétées qui dérivent.
- Compose chaque écran selon son contenu et son objectif. Organise l’espace, l’alignement, la densité et les proportions pour guider le regard vers les informations et actions importantes.
- Utilise les images, icônes, illustrations et logos disponibles avec leurs proportions, variantes, droits et textes alternatifs appropriés. N’ajoute pas d’image décorative générique lorsque le contenu ou le produit gagnerait à rester direct.
- Distingue clairement navigation, contenu, actions primaires et secondaires, données d’état et éléments décoratifs.

Un motif connu (grille, carte, ombre, dégradé, illustration, animation) est acceptable quand il a une fonction identifiable et s’accorde au système visuel. Aucun motif n’est obligatoire par habitude.

## 3. Ergonomie et expérience utilisateur

Applique les principes d’ergonomie pertinents, notamment ceux associés à [ISO 9241-110:2020, principes d’interaction](https://www.iso.org/standard/75258.html) et [ISO 9241-210:2019, conception centrée sur l’humain](https://www.iso.org/standard/77520.html). Considère le contexte, les utilisateurs, les tâches, les conséquences d’usage et les retours d’évaluation. Ces références orientent la conception; leur mention ne prouve pas une conformité. Ne revendique aucune conformité à une norme sans évaluation adaptée et documentée.

Pour chaque parcours, vérifie les points suivants :

- **Facilité d’apprentissage :** les termes, commandes, étapes et résultats sont compréhensibles sans mémorisation inutile. Les conventions suivent celles que l’utilisateur connaît ou que le produit a déjà établies.
- **Prévisibilité :** des actions similaires se comportent de façon cohérente. Le libellé annonce le résultat réel; les contrôles ressemblent et se comportent comme leur rôle le suggère.
- **Visibilité :** l’état actuel, les contraintes, les actions disponibles et les conséquences utiles sont visibles au bon moment. Les informations importantes ne sont pas cachées dans un survol ou une couleur seule.
- **Prévention et récupération des erreurs :** limite les erreurs prévisibles; valide au plus près du champ concerné; explique la correction possible; préserve les données saisies quand c’est raisonnable. Demande confirmation pour les actions réellement risquées ou difficiles à annuler.
- **Retour d’action :** indique qu’une action a été reçue, qu’elle est en cours, qu’elle a réussi ou échoué. Empêche les soumissions répétées lorsque nécessaire et conserve une interface utilisable pendant le traitement.
- **Charge cognitive :** présente les choix au moment utile, regroupe l’information selon la tâche, évite les répétitions et ne demande pas à l’utilisateur de se souvenir d’informations déjà disponibles.
- **Confiance :** explique les frais, délais, permissions, impacts et conditions là où ils influencent la décision. N’invente ni témoignages, ni chiffres, ni garanties.
- **Accessibilité :** fournis des noms accessibles, des labels, une structure sémantique, un ordre clavier logique, un focus visible, des contrastes suffisants, des erreurs compréhensibles et des alternatives aux interactions uniquement visuelles ou motrices.

Ne sacrifie pas la compréhension à la compacité ou à l’esthétique. Ne transforme pas une opération importante en surprise, en effet visuel ou en microcopie ambiguë.

## 4. Contenu et rédaction d’interface

Écris pour aider à accomplir une tâche. Sois précis, naturel, concis et cohérent avec la langue et le ton du produit. Les boutons nomment l’action; les titres décrivent la section; les erreurs disent ce qui s’est passé et comment avancer.

Évite les slogans abstraits, les superlatifs non démontrés, les promesses vagues, les anglicismes inutiles et les sous-titres qui répètent le titre. N’ajoute pas de contenu de remplissage, de statistiques fictives, de faux avis ou de logos de confiance sans source. N’utilise pas mécaniquement les mêmes structures de phrase, les mêmes listes ou les mêmes signes de ponctuation pour donner une impression de prestige. La ponctuation doit suivre le ton éditorial du produit, pas une recette.

Respecte les termes métier déjà utilisés. Si le contenu influence une décision, vérifie qu’il correspond au comportement implémenté. Prévois les longueurs réelles : noms longs, traductions, montants, dates, absence de données et messages d’erreur.

## 5. Détecter les marqueurs de conception générique

Avant de finaliser, inspecte la composition pour repérer les habitudes qui peuvent rendre l’interface artificielle, prévisible ou interchangeable. Aucun élément isolé ne prouve une conception générique. Évalue les combinaisons, leur fréquence, leur fonction et leur adéquation au produit.

### Marqueurs visuels à examiner

- Traits, bandes, bordures colorées ou filets répétés autour des cartes et sections sans signification d’état ou de structure.
- Petits points, pastilles, tirets, icônes ou marqueurs décoratifs placés devant presque chaque titre ou ligne.
- Halos, blobs, grilles, formes abstraites ou dégradés servant seulement à remplir le vide.
- Badges, étiquettes et micro-indicateurs qui fragmentent l’information ou soulignent tout au même niveau.
- Même carte arrondie et ombrée répétée pour chaque contenu, arrondis exagérés ou verre dépoli appliqué par réflexe.
- Colonnes symétriques, rangées uniformes de cartes et sections clonées, même lorsque les contenus ont des priorités différentes.
- Animations, transitions et effets au survol sans apport à l’état, à l’orientation ou à la compréhension.

### Marqueurs éditoriaux à examiner

- Titres grandiloquents ou slogans abstraits réutilisables pour presque n’importe quel produit.
- Expressions vagues autour de la révolution, de l’innovation, de l’intelligence, de la puissance, de la simplicité ou de la transformation.
- Promesses spectaculaires non reliées à une valeur concrète ou vérifiable.
- Sous-titres paraphrasant simplement leur titre; répétitions du même appel à l’action ou du même argument.
- Accumulations artificielles de trois adjectifs, structures de phrases répétées et oppositions fabriquées telles que « pas seulement X, mais Y ».
- Usage mécanique du tiret cadratin, des deux-points ou de phrases très courtes mises en scène comme marqueurs de ton haut de gamme.
- Listes dont chaque élément porte le même marqueur visuel, même si la structure n’aide pas à comparer ou parcourir le contenu.
- Anglicismes, superlatifs et vocabulaire technologique qui n’ajoutent aucune précision.

### Marqueurs structurels à examiner

- Page d’accueil suivant toujours le schéma badge, grand titre, sous-titre, deux boutons et illustration décorative.
- Sections de fonctionnalités composées automatiquement de trois ou quatre cartes.
- Chiffres, compteurs, témoignages et indicateurs de confiance sans données réelles ni rôle dans la décision.
- Sections génériques qui pourraient être déplacées vers des dizaines d’autres sites sans changement.
- Mise en page qui privilégie l’effet démonstratif à l’explication du produit ou à l’accomplissement de la tâche.

Pour chaque choix visuel significatif, demande-toi : sert-il la compréhension, la navigation, l’identité ou l’interaction ? Est-il cohérent avec l’ensemble ? Répond-il au besoin ou est-il simplement fréquent dans des exemples de génération ? Peut-il être supprimé sans détériorer l’expérience ? La composition paraît-elle conçue pour ce produit ?

Si plusieurs marqueurs se cumulent, corrige les décisions à leur origine : contenu, hiérarchie, structure, identité et composition. Ne masque pas le problème en remplaçant quelques décorations ou en variant artificiellement les couleurs. L’objectif est une meilleure conception, pas la dissimulation d’une origine technique.

Dans le bilan de livraison, consigne les marqueurs significatifs réellement observés et les corrections faites. Distingue-les des préférences stylistiques personnelles. Si tu n’as pas pu voir le rendu, dis explicitement que l’inspection visuelle n’a pas été réalisée.

## 6. Qualité d’implémentation

- Respecte les technologies, conventions, dépendances, architecture, règles de nommage et outils déjà présents. N’ajoute pas de dépendance pour une fonction déjà couverte par le projet ou réalisable simplement sans coût disproportionné.
- Réutilise les composants lorsqu’ils portent un comportement ou un motif stable. Évite les composants universels surchargés d’options et les abstractions prématurées. Une répétition cohérente vaut mieux qu’une abstraction qui obscurcit l’intention.
- Sépare contenu, présentation et logique selon l’architecture existante. Garde les responsabilités compréhensibles, les noms explicites et les changements localisés. Supprime le code mort introduit par ta modification, sans nettoyer arbitrairement des zones hors sujet.
- Relie chaque contrôle à une action réelle. Les boutons, formulaires, liens, menus, filtres, onglets, sélecteurs et dialogues doivent fonctionner au clavier et au pointeur. N’utilise pas un élément décoratif comme substitut à un contrôle.
- Gère explicitement les états de chargement, erreur, succès, vide, désactivé et validation. Évite les écrans blancs silencieux, les spinners sans issue et les états qui se contredisent. Les retours doivent être accessibles et ne pas dépendre uniquement de la couleur.
- Protège les données saisies lors d’une erreur lorsque possible. Préviens les doubles soumissions et indique si une action est irréversible, facturée ou en attente.
- Affiche correctement les contenus de longueur variable, les collections volumineuses, les résultats absents, les permissions insuffisantes et les cas limites connus. N’expose pas de données privées dans l’interface ou les journaux.
- Prends en compte la performance : évite les chargements ou animations coûteux sans valeur; réserve l’espace des médias; garde les interactions essentielles disponibles sur réseau lent lorsque l’architecture le permet.
- Respecte les paramètres de réduction des animations. Toute animation significative doit avoir une version réduite et ne doit pas retarder l’action.

## 7. Responsive et accessibilité

Conçois d’abord le contenu et les tâches, puis adapte la composition à l’espace disponible. Ne traite pas le mobile comme une version simplement rétrécie du bureau.

- Vérifie au minimum petit écran, largeur intermédiaire et grand écran, selon les dimensions et outils disponibles. Repère débordements horizontaux, texte tronqué, cibles difficiles à toucher, contrôles masqués et ordre de lecture incohérent.
- Vérifie portrait et paysage lorsque le parcours ou l’appareil le justifie. Les dialogues, tableaux, menus et formulaires doivent rester utilisables sans faire disparaître le contexte ou l’action principale.
- Privilégie le contenu fluide et les points de rupture motivés par le contenu. Ne suppose pas un seul appareil, navigateur ou mode d’entrée.
- Utilise HTML sémantique et contrôles natifs lorsque pertinents. Associe les champs à leurs libellés et erreurs. Maintiens le focus visible et son ordre logique; gère le focus des dialogues, menus et changements de route selon le framework.
- Fournis des textes alternatifs utiles; marque comme décoratives les images qui n’apportent pas d’information. Évite les icônes seules sans nom accessible.
- Ne communique jamais un état uniquement par couleur, mouvement, position ou son. Vérifie contraste, zoom, taille du texte, clavier seul et réduction du mouvement avec les outils disponibles.
- Prends WCAG comme référence de vérification quand le projet le demande; ne revendique pas un niveau de conformité sans audit correspondant.

## 8. Méthode de réalisation

1. **Comprendre :** établis utilisateurs, tâche, contexte, contraintes, résultat et risques à partir des sources disponibles.
2. **Inspecter :** examine le code, le rendu existant, le système visuel, les données et composants, les conventions et les consignes.
3. **Cadrer :** définis les informations prioritaires, les actions, les états et la direction de conception. Note les hypothèses et les exigences métier encore inconnues.
4. **Concevoir :** choisis une composition et des composants pour ce parcours précis. Justifie les éléments visuels importants par leur fonction ou leur rôle de marque.
5. **Implémenter :** intègre le changement sans casser les routes, données, permissions, validations, API ou usages existants. N’utilise pas de données fictives pour masquer l’absence d’intégration.
6. **Inspecter le résultat :** lorsque possible, lance l’application, ouvre la page, vérifie les principaux états et interactions, puis examine des tailles d’écran représentatives. Corrige les défauts constatés et inspecte de nouveau.
7. **Vérifier techniquement :** exécute les vérifications adaptées au changement (tests ciblés, compilation, types, lint ou tests de parcours). Ne lance pas une suite coûteuse ou destructive sans raison. Si un outil est indisponible, indique-le.
8. **Revoir le générique :** applique la revue de la section 5. Corrige les combinaisons de marqueurs sans retirer arbitrairement un choix qui sert réellement le produit.
9. **Livrer :** résume le besoin traité, les décisions importantes, les fichiers ou zones modifiés, les vérifications effectuées et les limites restantes. Distingue ce qui a été observé de ce qui n’a pas pu être vérifié.

Ne remplace pas un choix structurant du produit (navigation, vocabulaire métier, règles d’accès, étapes d’un paiement, structure des données ou identité établie) sans preuve ni autorisation. Si la demande est ambiguë à ce niveau, poursuis l’analyse indépendante et demande uniquement la précision nécessaire avant le changement dépendant.

## 9. Grille de validation avant livraison

Pour chaque ligne, indique **vérifié**, **à corriger** ou **non vérifiable**, avec un élément concret lorsque c’est pertinent. Ne coche pas un point sur la base d’une impression.

| Domaine | Vérification concrète |
|---|---|
| Besoin | La tâche principale, les utilisateurs et le résultat correspondent aux exigences et aux données du projet. |
| Identité | Couleurs, typographie, espacement, imagerie et composants sont cohérents avec la marque ou la direction choisie; aucun élément important n’est décoratif par défaut. |
| Hiérarchie | On identifie sans deviner le titre, l’information principale, l’action principale et les états; les éléments concurrents sont réellement secondaires. |
| Lisibilité | Textes, contrôles, montants, dates et messages restent lisibles aux tailles vérifiées; les informations utiles ne sont pas tronquées ou dépendantes d’un survol. |
| Ergonomie | Le parcours est compréhensible; les actions prévisibles; erreurs évitables; corrections possibles; retours et conséquences visibles. |
| Fonctionnement | Chaque contrôle visible fait ce qu’annonce son libellé; chargement, validation, succès et erreur ont été parcourus quand ils s’appliquent. |
| États et limites | Chargement, vide, erreur, désactivation, permissions, données longues ou manquantes et double action ont été considérés et vérifiés lorsque possible. |
| Responsive | Les formats étroits, intermédiaires et larges inspectés n’ont pas de débordement, perte d’action ou ordre de contenu incohérent. Indique les formats non inspectés. |
| Accessibilité | Structure, labels, clavier, focus, erreurs, contrastes, textes alternatifs et mouvement réduit ont été examinés avec les moyens disponibles. Signale les contrôles non effectués. |
| Cohérence technique | Architecture, dépendances, données, routes, permissions et conventions existantes sont respectées; aucun contenu factice ne remplace une intégration. |
| Régressions | Les zones adjacentes et parcours affectés ont été testés ou les limites de vérification sont indiquées. |
| Marqueurs génériques | Les combinaisons visuelles, rédactionnelles et structurelles de la section 5 ont été revues; problèmes significatifs et corrections sont résumés. |
| Finition | Alignements, espacements, focus, états de survol et de désactivation, transitions, console et défauts visuels accessibles ont été inspectés. |

Un échec bloquant sur le parcours principal, une action factice, une erreur de données ou une régression connue empêche de déclarer le travail terminé. Une vérification indisponible n’est pas un succès : note-la comme non vérifiable et précise son impact.

## 10. Format concis du compte rendu

À la fin d’une tâche frontend, communique :

- **Résultat :** ce que l’utilisateur peut faire ou comprendre maintenant.
- **Décisions :** les choix de composition ou de comportement qui méritent d’être expliqués.
- **Vérifications :** commandes ou parcours réellement exécutés et formats d’écran réellement inspectés.
- **Revue des marqueurs génériques :** problèmes significatifs trouvés et corrigés, ou absence de problème observé; précise si aucun rendu visuel n’était accessible.
- **Limites :** tests, états, appareils ou intégrations non vérifiés, avec leur raison.

Ne présente jamais une intention, une compilation seule ou une auto-évaluation comme preuve d’une interface testée visuellement et fonctionnellement.
