# Cahier des charges — Plateforme Horizon Service

**Site vitrine et tableau de bord de gestion de la revente de comptes Netflix**

| Rubrique | Détail |
| --- | --- |
| Version | 1.0, brouillon pour validation |
| Date | 22 octobre 2026 |
| Porteur du projet | Fondateur et administrateur principal de Horizon Service |
| Second utilisateur concerné | Second administrateur (consultation des données du business) |
| Territoire | Côte d’Ivoire (monnaie : franc CFA, FCFA) |
| Charte graphique | Blanc, rouge et noir |
| Confidentialité | Document interne. Il ne contient volontairement aucun identifiant, mot de passe ni code de profil. |
| Sources | Fichier de suivi « 1er Compte Netflix 27 mars 2026 », affiche commerciale Horizon Service, schéma MCD existant, règles d’ingénierie frontend du projet |

## Sommaire et mode d’emploi

Ce document est organisé en sept parties. Chaque partie peut être lue seule, mais les exigences fonctionnelles (partie C) s’appuient sur l’analyse de l’existant (partie A) et sur le cadrage (partie B).

| Partie | Sections | Contenu |
| --- | --- | --- |
| A. Le business | 1 à 4 | Contexte, présentation de Horizon Service, fonctionnement actuel, indicateurs financiers |
| B. Cadrage | 5 | Problème, objectifs, périmètre, parties prenantes, contraintes, planning |
| C. Exigences fonctionnelles | 6 à 12 | Rôles, site vitrine, tableau de bord module par module, règles de gestion, workflows, messages, rapports |
| D. Données | 13 | Modèle de données existant, évolutions, dictionnaire, migration depuis le bloc-notes |
| E. Technique | 14 | Architecture, sécurité, sauvegardes, performance, exploitation, API |
| F. Design et contenus | 15 et 16 | Logo, charte blanc/rouge/noir, système de composants, écrans, textes du site |
| G. Mise en œuvre | 17 à 21 | Tests, déploiement, risques, conformité, gouvernance |
| Annexes | A à H | Glossaire, gabarits de messages, formules, questions ouvertes, traçabilité |

**Conventions de lecture**

- Les exigences portent un identifiant stable : **EXG-** pour une exigence fonctionnelle, **ENF-** pour une exigence non fonctionnelle, **RG-** pour une règle de gestion, **US-** pour une user story.
- La priorité suit la méthode MoSCoW : **M** (indispensable au lancement), **S** (important, peut suivre juste après), **C** (souhaitable), **W** (hors périmètre pour l’instant).
- Les éléments marqués **\[À CONFIRMER\]** sont des hypothèses déduites du fichier de suivi ou de l’affiche. Ils ne doivent pas être implémentés avant validation par le porteur du projet.
- Les montants sont en FCFA. Les dates sont au format jour/mois/année.

## 1. Contexte, objet et cadre du document

### 1.1 Contexte

Horizon Service est la seconde activité de son fondateur, en parallèle de son métier dans l’informatique. Elle consiste à proposer à des clients, en Côte d’Ivoire, un accès à Netflix à partir de 1 500 FCFA par mois. Chaque client reçoit l’accès à un profil, rattaché à l’un des comptes Netflix gérés par Horizon Service.

Toute la gestion est aujourd’hui tenue dans un bloc-notes sur un téléphone : trois comptes, quinze profils, les codes d’accès, les clients, les dates de début et de fin, les montants, les chiffres d’affaires mensuels, le bénéfice et la situation de caisse. Ce fonctionnement a permis de démarrer et de dépasser 325 000 FCFA de chiffre d’affaires cumulé en sept mois. Il atteint maintenant ses limites.

### 1.2 Problèmes à l’origine du projet

1. **Dépendance à un seul appareil.** Si le téléphone tombe en panne, est perdu ou volé, les accès des clients ne peuvent plus être transmis et l’activité s’arrête.
2. **Absence de partage.** Le second administrateur veut consulter les données du business, mais ne le peut que lorsque le fondateur est connecté et lui montre le bloc-notes.
3. **Calculs manuels.** Les totaux (clients actifs, clients à terme, chiffre d’affaires, bénéfice, recharge) sont recalculés à la main et contiennent des écarts.
4. **Pas d’alerte.** Les échéances sont repérées visuellement par un symbole. Rien ne prévient automatiquement avant l’expiration d’un abonnement.
5. **Pas de visibilité commerciale.** L’activité repose sur une affiche et le bouche-à-oreille. Il n’existe pas de page où un prospect peut comprendre l’offre, voir les tarifs et contacter Horizon Service.
6. **Pas de traçabilité de la caisse.** Un écart important est constaté entre ce qui devrait se trouver en caisse et ce qui s’y trouve réellement.
7. **Données sensibles dans un fichier texte.** Les identifiants des comptes et des profils sont stockés en clair dans une note.

### 1.3 Objet du document

Ce cahier des charges décrit ce que la plateforme Horizon Service doit faire, pour qui, avec quelles règles et selon quelles contraintes. Il sert à quatre usages :

- cadrer le développement avec précision, sans ambiguïté sur le métier ;
- servir de référence de recette : chaque exigence doit pouvoir être testée ;
- permettre à un tiers (développeur, designer, associé) de comprendre le business sans passer par le fondateur ;
- documenter les décisions et les points restant à trancher.

### 1.4 Périmètre du document

Le document couvre :

- le **site vitrine public** de Horizon Service ;
- le **tableau de bord privé** de gestion (clients, comptes, profils, abonnements, échéances, encaissements, caisse, rapports, utilisateurs, journal d’activité) ;
- la **migration** des données du bloc-notes vers la plateforme ;
- l’**identité visuelle** (logo et charte blanc, rouge, noir) ;
- les exigences techniques, de sécurité et d’exploitation.

Il ne couvre pas la gestion du compte Netflix lui-même (paiement de l’abonnement Netflix, politique de Netflix), ni l’automatisation de la connexion aux comptes Netflix.

### 1.5 Public visé

| Lecteur | Ce qu’il cherche dans le document |
| --- | --- |
| Fondateur | Vérifier que le métier est correctement compris et que les priorités sont bonnes |
| Second administrateur | Comprendre quelles données il verra, avec quels droits |
| Développeur | Règles de gestion, modèle de données, API, contraintes techniques |
| Designer | Charte, logo, composants, parcours, états des écrans |
| Testeur | Critères d’acceptation et scénarios de recette |

### 1.6 Documents de référence

| Référence | Description | Usage dans ce document |
| --- | --- | --- |
| Fichier de suivi « 1er Compte Netflix 27 mars 2026 » | Note de gestion : comptes, profils, clients, dates, montants, indicateurs | Base de l’analyse de l’existant et des KPI |
| Affiche « Besoin d’un compte Netflix ? » | Visuel commercial de Horizon Service (conception : Lagh Design) | Offre, prix d’appel, numéros de contact, ton éditorial |
| Schéma MCD (Utilisateur, Client, Compte, Profil, Abonnement) | Modèle de données déjà pensé par le fondateur | Base du modèle de la section 13 |
| Règles d’ingénierie frontend | Référentiel de conception et de qualité d’interface | Exigences de design, d’accessibilité, d’états d’écran et de vérification |

### 1.7 Hypothèses générales

| ID | Hypothèse | Statut |
| --- | --- | --- |
| H1 | Chaque compte Netflix comporte 5 profils, comme observé dans le fichier (15 profils pour 3 comptes). | Observé |
| H2 | La capacité de référence est de 15 clients par compte, soit 45 places au total (mention « Total client x / 15 » dans le fichier). | Observé |
| H3 | Le symbole ⚠️ signale un abonnement qui arrive à échéance sous 10 jours ou déjà échu. | Observé |
| H4 | Le symbole ❌ placé après le code d’un profil signale que le code doit être changé. | Observé |
| H5 | Le mot « recharge » désigne le coût de renouvellement des comptes Netflix payé par Horizon Service. | Observé |
| H6 | Les clients paient principalement par Mobile Money et par espèces. | Observé |
| H7 | La transmission des accès et les relances se font par WhatsApp. | Observé |

## 2. Présentation de Horizon Service

### 2.1 Fiche d’identité

| Élément | Valeur |
| --- | --- |
| Nom commercial | Horizon Service |
| Activité | Revente d’accès à des profils Netflix par abonnement mensuel ou multi-mois |
| Zone | Côte d’Ivoire |
| Premier compte Netflix géré | 27 mars 2026 |
| Deuxième compte | 07 mai 2026 |
| Troisième compte | 18 juin 2026 |
| Premier mois de chiffre d’affaires | Avril 2026 (30 000 FCFA) |
| Prix d’appel affiché | 1 500 FCFA par mois |
| Contacts affichés sur l’affiche | Trois numéros WhatsApp et un QR code de contact |
| Création de l’affiche | Lagh Design |
| Statut | Activité secondaire du fondateur, gérée sans structure juridique documentée dans ce dossier |

### 2.2 Chronologie

| Date | Événement | Conséquence |
| --- | --- | --- |
| 27 mars 2026 | Ouverture du premier compte (15 places) | Début de l’activité |
| Avril 2026 | Premier mois de vente | 30 000 FCFA de chiffre d’affaires |
| 07 mai 2026 | Ouverture du deuxième compte | Capacité portée à 30 places |
| 18 juin 2026 | Ouverture du troisième compte | Capacité portée à 45 places, chiffre d’affaires de 51 000 FCFA en juin |
| Septembre 2026 | Meilleur mois | 64 500 FCFA, soit 43 abonnements facturés à 1 500 FCFA |
| 22 octobre 2026 | Date de ce document | 43 lignes d’abonnement enregistrées, dont 14 marquées à échéance proche |

### 2.3 L’offre

Horizon Service vend un **accès à un profil Netflix** hébergé sur un compte géré par ses soins. Le client reçoit :

- l’adresse du compte et son mot de passe ;
- le nom du profil qui lui est attribué ;
- le code du profil, lorsqu’il est protégé par un code ;
- la durée convenue.

L’affiche promet des comptes disponibles « pour tous vos écrans préférés en toute sécurité ». Le projet doit donc faire en sorte que cette promesse soit tenable : un accès toujours retrouvable, un suivi des échéances fiable et une réponse rapide en cas de problème.

### 2.4 Grille tarifaire observée

Le fichier de suivi montre quatre formules réellement vendues :

| Formule | Durée observée | Prix observé | Prix mensuel équivalent | Exemple dans le fichier |
| --- | --- | --- | --- | --- |
| Mensuelle | 1 mois | 1 500 FCFA | 1 500 | La majorité des lignes |
| Bimestrielle | 2 mois | 2 500 FCFA | 1 500 | 26/08/26 au 26/10/26 |
| Trimestrielle | 3 mois | 4 000 FCFA | 1 500 | 26/07/26 au 26/10/26 |
| Longue durée | environ 7 mois | 10 000 FCFA | environ 1 430 | 23/04/26 au 23/11/26 |

La plateforme ne doit pas figer ces tarifs dans le code. Les formules sont des données modifiables par un administrateur (EXG-OFF-01).

### 2.5 Clientèle

Le fichier ne contient ni âge ni profession des clients. Il identifie les clients par un numéro (« cl 71 », « cl 104 ») ou par une mention libre (« monsieur », « cousine », « ami »). On peut en tirer trois constats vérifiables :

- **43 lignes d’abonnement** sont ouvertes, qui correspondent à moins de 43 personnes : certains numéros reviennent (cl 66 et « cl 66 bis », cl 71 et « cl 71 ami », cl 90 sur deux comptes). Un même client peut donc avoir plusieurs abonnements.
- Les clients sont numérotés jusqu’à **108**, ce qui indique qu’environ 108 clients ont été enregistrés depuis le début, pour une base de 41 clients actifs au dernier relevé.
- Une partie des clients vient par recommandation (mentions « ami », « cousine »).

La plateforme doit remplacer ces numéros par de vraies fiches clients (nom, numéro WhatsApp, historique), tout en conservant l’ancien numéro comme référence de migration.

### 2.5.1 Personas à valider

Ces profils servent à guider les parcours du site vitrine. Ils sont \[À CONFIRMER\] par des échanges avec de vrais clients.

| Persona | Situation | Besoin principal | Ce qui le fait renoncer |
| --- | --- | --- | --- |
| Étudiant ou jeune actif | Budget limité, regarde sur téléphone | Un prix bas et un paiement simple | Un prix flou, un paiement compliqué |
| Famille | Veut plusieurs écrans, regarde sur télévision | Une offre claire, un accès stable | Des coupures, un support injoignable |
| Client de bouche-à-oreille | A reçu le contact d’un proche | Une confirmation rapide que le service est sérieux | L’absence de page de présentation |
| Revendeur potentiel | Veut des accès en volume | Des conditions de gros | Aucune offre dédiée (hors périmètre actuel) |

### 2.6 Canaux d’acquisition et de contact

L’affiche indique un seul canal de contact : **WhatsApp** (trois numéros et un QR code). Il n’y a ni site, ni formulaire, ni réseau social mentionné. Le site vitrine devra donc :

- conserver WhatsApp comme canal principal de conversion ;
- offrir un bouton de contact direct qui ouvre une conversation avec un message pré-rempli ;
- permettre de garder les trois numéros, avec une règle de répartition définie par le fondateur \[À CONFIRMER\].

### 2.7 Équipe et rôles

| Rôle | Personne | Responsabilités actuelles | Accès aux données aujourd’hui |
| --- | --- | --- | --- |
| Propriétaire, administrateur principal | Fondateur | Ventes, renouvellements, relances, achats de recharge, suivi des chiffres | Total (bloc-notes sur son téléphone) |
| Second administrateur | Associé de confiance | Souhaite suivre le business | Seulement quand le fondateur est connecté |
| Associés prélevant sur la caisse | Deux personnes, désignées dans le fichier de suivi | Prélèvements enregistrés dans le bilan de caisse | Aucun accès propre |

La plateforme doit rendre ces responsabilités explicites par des rôles et des permissions (section 6).

### 2.8 Proposition de valeur

Pour le client : un accès Netflix à prix réduit, avec un interlocuteur qui répond sur WhatsApp et prévient avant l’expiration.

Pour l’entreprise : un outil qui garantit la disponibilité des accès, prévient les oublis de relance et fait apparaître la vraie rentabilité.

La valeur différenciante à mettre en avant sur le site doit rester **vérifiable** : prix affichés, durée des formules, délai de réponse réel, procédure en cas de problème. Aucun chiffre, avis ou garantie ne doit être inventé (voir section 16).

### 2.9 Analyse SWOT

|  | Éléments internes | Éléments externes |
| --- | --- | --- |
| **Positifs** | **Forces :** prix bas et simple, croissance de 30 000 à plus de 60 000 FCFA mensuels en six mois, 3 comptes opérationnels, fondateur technicien capable de construire son propre outil | **Opportunités :** forte demande de streaming, mobile money répandu, site vitrine inexistant donc gain de crédibilité facile, possibilité d’un espace client |
| **Négatifs** | **Faiblesses :** gestion sur un seul téléphone, calculs manuels, caisse non rapprochée, mots de passe en clair, partage des mêmes codes entre profils de comptes différents | **Menaces :** conditions d’utilisation de Netflix qui n’autorisent pas la revente d’accès, suspension de comptes, concurrents moins chers, évolution des règles de partage de comptes |

### 2.10 Concurrence et positionnement

Le fichier ne contient aucune donnée sur les concurrents. Les concurrents probables sont d’autres revendeurs actifs sur WhatsApp et les réseaux sociaux, ainsi que l’abonnement direct à Netflix. Le positionnement de Horizon Service doit se jouer sur la **fiabilité** (accès retrouvable, rappel d’échéance, réponse rapide) plutôt que sur le seul prix, car le prix d’appel de 1 500 FCFA est facile à copier. Une veille concurrentielle chiffrée est proposée en annexe (question ouverte Q-12).

## 3. Fonctionnement actuel (AS-IS)

### 3.1 Structure du bloc-notes

Le fichier de suivi est organisé en trois blocs de comptes, suivis d’un bloc de bilan. Chaque bloc de compte contient :

1. un titre indiquant le rang du compte et sa date d’ouverture ;
2. l’adresse du compte et son mot de passe ;
3. un compteur « Total client x / 15 » ;
4. cinq profils, chacun avec un code, un compteur entre parenthèses et la liste de ses abonnements.

Une ligne d’abonnement suit le format : `date de début - date de fin (identifiant client) montant`, éventuellement suivie du symbole ⚠️.

### 3.2 Inventaire des comptes au 22/10/2026

Les identifiants sont volontairement omis.

| Compte | Ouvert le | Profils | Lignes d’abonnement | Capacité de référence | Taux d’occupation | Lignes marquées ⚠️ |
| --- | --- | --- | --- | --- | --- | --- |
| Compte 1 | 27/03/2026 | 5 | 15 | 15 | 100 % | 4 |
| Compte 2 | 07/05/2026 | 5 | 11 | 15 | 73 % | 5 |
| Compte 3 | 18/06/2026 | 5 | 17 | 15 | 113 % | 5 |
| **Total** |  | **15** | **43** | **45** | **96 %** | **14** |

Le compte 3 dépasse la capacité de référence (17 sur 15). Aucune règle écrite ne dit si ce dépassement est voulu ou toléré. La plateforme doit rendre la capacité **paramétrable** et **bloquante ou avertissante** selon la règle choisie (RG-CAP-02).

### 3.3 Inventaire des profils

| Compte | Profil | Nombre de lignes | Code marqué à changer (❌) |
| --- | --- | --- | --- |
| 1 | Admin | 3 | Non |
| 1 | Smart | 3 | Non |
| 1 | Orion | 4 | Oui |
| 1 | June | 3 | Oui |
| 1 | DevOps | 2 | Non |
| 2 | Goat | 3 | Oui |
| 2 | Artémis | 2 | Non |
| 2 | Tech | 2 | Non |
| 2 | Emmanuel | 1 | Oui |
| 2 | La capuche | 3 | Non |
| 3 | Admin2 | 4 | Non |
| 3 | Ghost | 3 | Non |
| 3 | Menace | 3 | Non |
| 3 | Scorpion | 4 | Non |
| 3 | IT | 3 | Non |

On constate qu’un profil porte entre 1 et 4 abonnements, avec une moyenne d’environ 2,9. La règle réelle de partage d’un profil entre plusieurs clients doit être formalisée (RG-CAP-03).

### 3.4 Processus actuels

| Processus | Déroulement actuel | Faiblesse |
| --- | --- | --- |
| Vente | Le client contacte Horizon Service sur WhatsApp. Le fondateur choisit un profil disponible, ajoute une ligne dans la note et envoie les accès. | Aucun contrôle de disponibilité automatique, risque d’erreur de profil |
| Encaissement | Le montant est noté sur la ligne d’abonnement. Le paiement lui-même n’est pas tracé (mode, référence, date). | Impossible de rapprocher la caisse |
| Renouvellement | Les dates de la ligne sont modifiées à la main. | Risque d’oubli ou de date erronée |
| Relance | Le fondateur repère les ⚠️ et écrit au client. | Aucune alerte, aucune trace de la relance |
| Expiration | Le client n’est pas relancé ou le profil est libéré à la main. | Un client expiré peut garder un accès, d’où le symbole ❌ sur les codes |
| Changement de code de profil | Le code est modifié dans Netflix puis dans la note. | Code identique sur plusieurs profils de comptes différents |
| Achat de recharge | Le montant est ajouté à la ligne « recharge » du mois. | Coût par compte non détaillé |
| Bilan mensuel | Chiffre d’affaires, bénéfice et recharge sont calculés à la main. | Erreurs possibles, aucun historique de détail |

### 3.5 Légende des symboles

| Symbole | Sens supposé | Règle logicielle proposée |
| --- | --- | --- |
| ⚠️ après une ligne | Échéance dans 7 jours ou moins, ou échéance dépassée | Statut calculé automatiquement : « À échéance » |
| ❌ après un code de profil | Code à changer après le départ d’un client | Indicateur « Code à renouveler » avec tâche associée |
| 💶 en séparateur | Séparation visuelle entre les comptes | Sans objet |
| (3), (4)… après un profil | Nombre de clients du profil | Calculé automatiquement |

### 3.6 Audit de la qualité des données observées

Le fichier de suivi contient plusieurs anomalies. Elles illustrent pourquoi la saisie libre doit être remplacée par des formulaires contrôlés.

| # | Observation | Où | Risque | Contrôle prévu dans la plateforme |
| --- | --- | --- | --- | --- |
| 1 | Date de début identique à la date de fin (15/11/26 au 15/11/26) | Compte 1, profil Admin | Durée nulle, chiffre d’affaires mal daté | La date de fin doit être postérieure à la date de début |
| 2 | Année incohérente (16/10/25 au 16/11/26) | Compte 3, profil Scorpion | Durée de 13 mois facturée 1 500 FCFA | Contrôle de cohérence durée et montant |
| 3 | Client vide « () » | Compte 3, profil Admin2 | Abonnement sans propriétaire | Client obligatoire |
| 4 | Même client sur deux comptes avec deux échéances différentes (cl 90) | Comptes 2 et 3 | Relance en double ou oubli | Vue consolidée par client |
| 5 | Codes de profil identiques sur des comptes différents (par exemple un même code sur trois profils) | Comptes 1, 2 et 3 | Un client qui connaît un code peut deviner d’autres profils | Génération de codes uniques par compte |
| 6 | Même mot de passe pour les trois comptes | Fichier entier | Compromission d’un compte, donc des trois | Mot de passe distinct par compte, stocké chiffré |
| 7 | Total des échéances saisi à 16, alors que 14 lignes portent ⚠️ | Bilan | Chiffre faux ou périmé | KPI calculés, jamais saisis |
| 8 | Dépassement de capacité non signalé (17 sur 15) | Compte 3 | Surcharge, risque de blocage | Alerte de capacité |
| 9 | Identifiants de connexion écrits en clair dans une note | Fichier entier | Fuite si le téléphone est perdu ou partagé | Chiffrement et journal de consultation |
| 10 | Libellés clients non homogènes (« monsieur », « cousine », « ami », numéros) | Plusieurs lignes | Recherche impossible, doublons | Fiche client normalisée |

### 3.7 Limites du système actuel

- **Disponibilité :** un seul exemplaire des données, sur un seul téléphone.
- **Partage :** pas de consultation à distance pour un second administrateur.
- **Fiabilité :** calculs manuels, saisie libre, aucune validation.
- **Traçabilité :** aucune trace de qui a modifié quoi, ni des paiements.
- **Réactivité :** aucune alerte avant échéance.
- **Sécurité :** données sensibles non chiffrées.
- **Image :** aucun support en ligne pour rassurer et convertir un nouveau client.

## 4. Analyse financière et indicateurs (KPI)

Cette section reprend les chiffres du fichier de suivi, vérifie leur cohérence et définit les indicateurs que la plateforme devra calculer automatiquement. Tous les montants sont en milliers de FCFA (K) sauf mention contraire.

### 4.1 Résultats mensuels d’avril à octobre 2026

| Mois | Chiffre d’affaires | Recharge (coût) | Bénéfice | Taux de marge |
| --- | --- | --- | --- | --- |
| Avril | 30 | 6 | 24 | 80,0 % |
| Mai | 28,5 | 12,5 | 16 | 56,1 % |
| Juin | 51 | 19,5 | 31,5 | 61,8 % |
| Juillet | 52 | 19,5 | 32,5 | 62,5 % |
| Août | 56 | 19,5 | 36,5 | 65,2 % |
| Septembre | 64,5 | 19,5 | 45 | 69,8 % |
| Octobre (au 22/10) | 43,5 | 21 | 22,5 | 51,7 % |
| **Total** | **325,5** | **117,5** | **208** | **63,9 %** |

Les totaux du fichier sont arithmétiquement corrects : 325,5 − 117,5 = 208. Les calculs mensuels le sont aussi. Les ratios ci-dessus sont calculés pour ce document et n’existent pas dans le fichier.

**Lectures utiles**

- Le chiffre d’affaires moyen est de 46,5 K par mois et le bénéfice moyen de 29,7 K par mois sur sept mois.
- Entre avril et septembre, le chiffre d’affaires a été multiplié par 2,15. Septembre dépasse août de 15,2 %.
- Le recul apparent d’octobre vient en grande partie du fait que le mois n’est pas terminé à la date du relevé. Il faut le confirmer avec les encaissements des derniers jours.
- La recharge est stable à 19,5 K de juin à septembre, ce qui correspond à 6,5 K par compte pour trois comptes \[À CONFIRMER\]. Elle monte à 21 K en octobre sans explication dans le fichier. La plateforme doit enregistrer chaque achat de recharge par compte pour expliquer ce type de variation.
- Le « bénéfice » du fichier est une marge brute : chiffre d’affaires moins recharge. Les autres coûts éventuels (conception de l’affiche, crédit de connexion, frais Mobile Money) ne sont pas décomptés.

### 4.2 Capacité théorique et point mort

| Indicateur | Calcul | Résultat |
| --- | --- | --- |
| Places disponibles | 3 comptes × 15 places | 45 |
| Chiffre d’affaires mensuel maximal au tarif de 1 500 FCFA | 45 × 1 500 | 67 500 FCFA |
| Coût mensuel estimé de recharge | 3 × 6 500 (hypothèse) | 19 500 FCFA |
| Marge mensuelle maximale à pleine capacité | 67 500 − 19 500 | 48 000 FCFA |
| Point mort par compte | 6 500 ÷ 1 500 | 4,3, soit 5 clients |
| Point mort pour 3 comptes | 19 500 ÷ 1 500 | 13 clients |

À pleine capacité et au tarif mensuel, Horizon Service ne peut donc pas dépasser environ 48 000 FCFA de marge par mois avec trois comptes. Septembre (45 K de bénéfice) était déjà proche de ce plafond. Toute croissance supplémentaire suppose un quatrième compte ou un relèvement du prix moyen. La plateforme doit donc afficher la capacité restante et le point mort pour aider à décider de l’ouverture d’un nouveau compte.

### 4.3 Situation de caisse

Le fichier de suivi présente le bilan suivant :

| Ligne | Montant |
| --- | --- |
| Bénéfice cumulé qui devrait se trouver en caisse | 208 K |
| Montant réellement présent en caisse | 10 K |
| Écart | 198 K |
| Prélèvements identifiés par le fondateur, associé A | 125 K |
| Prélèvements identifiés par le fondateur, associé B | 63 K |
| Total des prélèvements identifiés | 188 K |
| **Écart non expliqué** | **10 K** |

Autrement dit, 90,4 % du bénéfice cumulé a été prélevé, dont 60,1 % par l’associé A et 30,3 % par l’associé B, et 4,8 % reste sans explication. Les noms ne sont pas repris dans ce cahier des charges pour qu’il puisse être partagé sans exposer ces informations.

Ce bilan a été obtenu par un calcul manuel. Il démontre l’intérêt de trois fonctions :

1. enregistrer chaque sortie de caisse avec son bénéficiaire, son motif et sa date ;
2. comparer en continu la caisse théorique et la caisse réelle ;
3. rendre l’historique visible aux administrateurs, avec un journal qui ne peut pas être modifié silencieusement.

Les règles correspondantes figurent aux sections 8.9 et 9 (RG-CAI-01 à RG-CAI-08).

### 4.4 Méthode de comptabilisation du chiffre d’affaires

Le fichier ne dit pas si le chiffre d’affaires d’un mois correspond aux paiements reçus ce mois-là ou aux mois de service consommés. Deux indices vont dans le sens d’une comptabilité **d’encaissement** : le chiffre d’affaires de septembre (64,5 K) est exactement égal à 43 abonnements d’un mois, et une formule de 3 mois à 4 500 FCFA apparaît sans étalement visible.

| Méthode | Principe | Avantage | Inconvénient |
| --- | --- | --- | --- |
| Encaissement (proposée par défaut) | Le montant compte dans le mois du paiement | Simple, proche de la caisse, cohérente avec l’existant | Un mois peut paraître très fort après plusieurs paiements longs |
| Rattachement au service | Le montant est réparti sur les mois couverts | Mesure la vraie activité mensuelle | Plus complexe, s’éloigne de la caisse |

La plateforme calculera les deux. Le **chiffre d’affaires d’encaissement** sera l’indicateur principal du tableau de bord, par continuité avec le fichier. \[À CONFIRMER\]

### 4.5 Catalogue des indicateurs à produire

| Code | Indicateur | Définition | Formule | Fréquence | Alerte proposée |
| --- | --- | --- | --- | --- | --- |
| K01 | Chiffre d’affaires du mois | Somme des encaissements du mois | Σ paiements du mois | Temps réel | Aucune |
| K02 | Chiffre d’affaires cumulé | Depuis le démarrage | Σ de tous les paiements | Temps réel | Aucune |
| K03 | Coût de recharge du mois | Achats de renouvellement Netflix | Σ recharges du mois | Temps réel | Écart de plus de 10 % avec le mois précédent |
| K04 | Bénéfice du mois | Marge brute | K01 − K03 | Temps réel | Négatif |
| K05 | Taux de marge | Part du bénéfice dans le chiffre d’affaires | K04 ÷ K01 | Temps réel | Sous 50 % |
| K06 | Clients actifs | Clients ayant au moins un abonnement non échu | Comptage distinct | Temps réel | Aucune |
| K07 | Abonnements actifs | Lignes dont la date de fin est future ou égale à aujourd’hui | Comptage | Temps réel | Aucune |
| K08 | Abonnements à terme | Date de fin dans les 7 jours (paramétrable) | Comptage | Quotidienne | Plus de 10 |
| K09 | Abonnements échus | Date de fin dépassée, non renouvelés | Comptage | Quotidienne | Plus de 0 depuis 3 jours |
| K10 | Taux d’occupation global | Places utilisées sur capacité | K07 ÷ capacité totale | Temps réel | Plus de 100 % ou moins de 70 % |
| K11 | Taux d’occupation par compte | Même calcul par compte | Lignes du compte ÷ capacité du compte | Temps réel | Plus de 100 % |
| K12 | Places libres | Capacité moins lignes actives | Capacité − K07 | Temps réel | Moins de 3 |
| K13 | Taux de renouvellement | Part des abonnements échus qui sont renouvelés dans les 7 jours | Renouvelés ÷ échus | Mensuelle | Sous la moyenne des 3 derniers mois |
| K14 | Taux de départ | Part des clients non renouvelés | 1 − K13 | Mensuelle | Au-dessus de la moyenne |
| K15 | Revenu moyen par abonnement | Panier moyen | K01 ÷ nombre de paiements | Mensuelle | Aucune |
| K16 | Durée moyenne d’abonnement | Durée moyenne des lignes terminées | Moyenne des durées | Mensuelle | Aucune |
| K17 | Chiffre d’affaires attendu à 30 jours | Renouvellements dus dans les 30 prochains jours | Σ tarifs des abonnements arrivant à échéance | Quotidienne | Aucune |
| K18 | Caisse théorique | Ce qui devrait être en caisse | Σ encaissements − Σ recharges − Σ prélèvements − autres sorties | Temps réel | Aucune |
| K19 | Caisse réelle | Comptage saisi | Saisie datée | À chaque pointage | Aucune |
| K20 | Écart de caisse | Différence | K18 − K19 | À chaque pointage | Tout écart non nul |
| K21 | Prélèvements par associé | Sorties de caisse par bénéficiaire | Σ par personne | Temps réel | Part supérieure à un seuil défini |
| K22 | Impayés | Abonnements dont le paiement est enregistré comme en attente | Σ montants en attente | Temps réel | Plus de 3 jours |
| K23 | Point mort | Nombre de clients à atteindre | Coût mensuel ÷ prix moyen | Mensuelle | Sous le point mort |
| K24 | Délai moyen de première réponse | Temps entre une demande et la première réponse | Moyenne | Mensuelle | Au-dessus de l’objectif défini (phase 2) |

### 4.6 Anomalies à corriger avant migration

| Observation | Détail | Action |
| --- | --- | --- |
| Abonnements à terme | Le fichier annonce 16 sur 43. Quatorze lignes seulement portent le symbole ⚠️. | Définir la règle et recalculer. |
| Clients actifs | Le fichier annonce 41 sur 45, alors que 43 lignes sont ouvertes. | Distinguer lignes, clients et places. |
| Dénominateur | Le total annoncé est 45 pour les clients actifs, mais 43 pour les clients à terme. | Choisir une seule base (places ou lignes). |
| Recharge d’octobre | 21 K au lieu de 19,5 K. | Détailler par compte. |
| Caisse | 10 K d’écart non expliqué. | Pointage de caisse initial à la mise en service. |

### 4.7 Principe de calcul

Aucun indicateur ne doit être saisi à la main. Tous sont calculés à partir des abonnements, des paiements et des mouvements de caisse enregistrés. Si une valeur doit être corrigée, on corrige la donnée source, ce qui met à jour l’indicateur (ENF-DON-03).

## 5. Cadrage du projet

### 5.1 Problème à résoudre

Le fondateur doit pouvoir **gérer, consulter et partager** l’activité de Horizon Service depuis n’importe quel appareil, sans dépendre de son téléphone, tout en donnant à l’entreprise une présence en ligne crédible.

### 5.2 Objectifs

| ID | Objectif | Indicateur de réussite | Cible proposée | Échéance proposée |
| --- | --- | --- | --- | --- |
| OBJ-01 | Supprimer la dépendance au téléphone | Les accès clients sont consultables depuis un autre appareil authentifié | 100 % des comptes, profils et abonnements dans la plateforme | Mise en service |
| OBJ-02 | Donner accès au second administrateur | Connexion autonome avec droits adaptés | Accès en lecture complet sans présence du fondateur | Mise en service |
| OBJ-03 | Fiabiliser les chiffres | Écart entre KPI affichés et vérification manuelle | 0 écart sur un échantillon de 3 mois | Recette |
| OBJ-04 | Réduire les oublis de relance | Abonnements échus non relancés | Moins de 2 par semaine | 2 mois après mise en service |
| OBJ-05 | Contrôler la caisse | Pointages et écarts documentés | 1 pointage par mois minimum | Dès le premier mois |
| OBJ-06 | Présenter l’activité en ligne | Site vitrine public accessible | Offre, tarifs, FAQ, contact WhatsApp en ligne | Lot site vitrine |
| OBJ-07 | Sécuriser les identifiants | Aucun mot de passe en clair dans l’interface ni en base | 100 % chiffrés, consultation tracée | Mise en service |
| OBJ-08 | Poser une identité de marque | Logo et charte validés | Logo distinct de Netflix, charte blanc, rouge, noir | Lot design |

Les cibles sont des propositions à valider par le fondateur. Elles servent à orienter la recette.

### 5.3 Périmètre fonctionnel

| Domaine | Dans le périmètre initial (MVP) | Phase 2 | Hors périmètre |
| --- | --- | --- | --- |
| Site vitrine | Accueil, offres et tarifs, comment ça marche, FAQ, contact WhatsApp, mentions légales | Blog, formulaire de demande, page de statut | Boutique de paiement en ligne |
| Authentification | Connexion sécurisée des administrateurs, rôles | Double authentification obligatoire pour tous | Connexion avec réseaux sociaux |
| Clients | Fiches, historique, doublons | Étiquettes, notes enrichies | Application mobile native |
| Comptes et profils | Gestion complète, capacité, codes, chiffrement | Rotation assistée des codes | Connexion automatique à Netflix |
| Abonnements | Création, renouvellement, expiration, transfert de profil | Offres promotionnelles | Facturation légale avec TVA |
| Paiements | Enregistrement manuel, mode de paiement, référence | Rapprochement avec relevés Mobile Money | Passerelle de paiement intégrée |
| Caisse | Entrées, sorties, prélèvements, pointage, écart | Budgets, catégories avancées | Comptabilité générale |
| Alertes | Tableau d’échéances, liens WhatsApp pré-remplis | Envoi automatique via interface WhatsApp Business | Envoi massif sans consentement |
| Rapports | KPI, exports CSV et PDF | Rapport mensuel envoyé automatiquement | Tableaux décisionnels avancés |
| Espace client | Non | Consultation de l’échéance et demande de renouvellement | Gestion par le client de son profil Netflix |
| Audit | Journal d’activité, consultations d’identifiants | Alertes de sécurité | SIEM externe |

### 5.4 Parties prenantes

| Partie prenante | Intérêt | Influence | Attente principale |
| --- | --- | --- | --- |
| Fondateur | Pérennité et contrôle de l’activité | Décide de tout | Un outil fiable qui fait gagner du temps |
| Second administrateur | Transparence sur les chiffres | Forte | Consultation autonome des données |
| Associés avec prélèvements | Visibilité sur leurs sorties | Moyenne | Historique clair et partageable |
| Clients | Accès stable et rappel avant expiration | Indirecte | Réponse rapide, accès à jour |
| Prospects | Comprendre et acheter | Indirecte | Informations claires, contact simple |
| Designer de l’affiche | Cohérence visuelle | Faible | Reprise des éléments de marque |
| Netflix | Conditions d’utilisation du service | Forte et externe | Non maîtrisable, à traiter comme un risque |

### 5.5 Contraintes

| Type | Contrainte |
| --- | --- |
| Connectivité | Les utilisateurs se connectent surtout depuis un smartphone, parfois avec un débit limité. Les pages doivent rester légères. |
| Appareils | Android d’entrée ou de milieu de gamme, navigateurs mobiles récents, écrans étroits. La conception part du mobile. |
| Ressources | Le fondateur est développeur et peut réaliser ou superviser le projet. Le temps disponible est limité, car il s’agit d’une activité secondaire. |
| Budget | Non communiqué. Le choix technique doit viser un coût d’hébergement faible. \[À CONFIRMER\] |
| Langue | Français. Le vocabulaire métier existant est conservé (compte, profil, abonnement, recharge, caisse). |
| Identité | Charte blanc, rouge, noir. Le logo doit évoquer l’univers Netflix sans pouvoir être confondu avec lui. |
| Données | Les identifiants de comptes sont sensibles. Ils doivent être chiffrés et leur consultation tracée. |
| Légal | Protection des données personnelles des clients (numéros de téléphone) et mentions légales du site. |
| Continuité | La plateforme ne doit pas dépendre du téléphone du fondateur, ni d’un seul administrateur. |

### 5.6 Hypothèses et dépendances

| ID | Hypothèse ou dépendance | Conséquence si elle est fausse |
| --- | --- | --- |
| D1 | Le fondateur fournit les données complètes du bloc-notes pour la migration | Migration incomplète |
| D2 | Les trois numéros WhatsApp de l’affiche sont conservés | Mettre à jour le site et les gabarits |
| D3 | Les prix restent ceux de la grille observée | Paramétrage à adapter |
| D4 | Un nom de domaine est acheté ou disponible | Le site vitrine ne peut pas être publié sous la marque |
| D5 | Les clients acceptent la collecte de leur numéro | Ajuster le consentement et la rétention |
| D6 | Le second administrateur n’a pas besoin de modifier les données au lancement | Ajouter des permissions d’écriture |

### 5.7 Découpage en lots

| Lot | Contenu | Durée estimée | Charge estimée | Livrable |
| --- | --- | --- | --- | --- |
| L0 | Cadrage, validation du cahier des charges, logo, charte | 1 semaine | 3 à 5 jours | Document validé, logo vectoriel, jetons de design |
| L1 | Socle technique : dépôt, base de données, authentification, rôles, journal d’audit | 2 semaines | 8 à 10 jours | API protégée, connexion, 3 rôles |
| L2 | Clients, comptes, profils, offres, capacité, chiffrement des identifiants | 2 semaines | 10 à 12 jours | Écrans de gestion et règles de capacité |
| L3 | Abonnements, renouvellements, échéances, liens WhatsApp, tâches de changement de code | 2 semaines | 10 à 12 jours | Cycle de vie complet des abonnements |
| L4 | Paiements, recharges, caisse, prélèvements, pointages, KPI | 2 semaines | 10 à 12 jours | Tableau de bord financier |
| L5 | Site vitrine public, SEO, contact, contenus | 1,5 semaine | 6 à 8 jours | Site en ligne |
| L6 | Rapports, exports, notifications internes, paramètres | 1 semaine | 5 à 6 jours | Rapports mensuels |
| L7 | Migration des données, recette, corrections, bascule | 1,5 semaine | 7 à 9 jours | Mise en service |
| **Total** |  | **environ 13 semaines** | **59 à 74 jours** |  |

Les durées et charges sont des estimations de cadrage pour un développeur unique. Elles seront affinées après validation du document. La phase 2 (espace client, envoi automatisé, rapprochement Mobile Money) est planifiée après trois mois d’exploitation.

### 5.8 Facteurs clés de succès

1. Migrer proprement les données existantes plutôt que repartir de zéro.
2. Garder les écrans de saisie très courts, car la plupart des opérations se font depuis un smartphone, souvent entre deux conversations.
3. Rendre les alertes d’échéance impossibles à rater.
4. Faire valider les règles de capacité et de caisse avant de développer.
5. Prévoir une sauvegarde testée et un second administrateur dès le premier jour.

### 5.9 Gouvernance du projet

| Rituel | Fréquence | Participants | Objet |
| --- | --- | --- | --- |
| Point d’avancement | Hebdomadaire | Fondateur, développeur | Revue du lot en cours, blocages |
| Validation de lot | À la fin de chaque lot | Fondateur, second administrateur | Recette fonctionnelle |
| Revue des questions ouvertes | Toutes les deux semaines | Fondateur | Trancher les points \[À CONFIRMER\] |
| Revue de sécurité | Avant la mise en service | Fondateur | Droits, sauvegardes, journal |

## 6. Rôles et permissions

### 6.1 Principe

La plateforme remplace un accès unique (le téléphone du fondateur) par des comptes nominatifs. Chaque personne se connecte avec son propre identifiant et ne voit que ce que son rôle autorise. Aucune opération sensible n’est possible sans être connecté, et toute action sensible est tracée avec le nom de l’utilisateur, la date et l’heure.

### 6.2 Rôles

| Rôle | Qui | Description |
| --- | --- | --- |
| Propriétaire | Fondateur | Tous les droits, y compris la gestion des utilisateurs, des paramètres et de la suppression définitive. Il ne peut pas être retiré par un autre utilisateur. |
| Administrateur | Personne de confiance qui gère au quotidien \[À CONFIRMER\] | Gère clients, abonnements, paiements, caisse et comptes. Ne gère pas les utilisateurs ni les paramètres critiques. |
| Observateur | Second administrateur au démarrage | Consulte les tableaux de bord, les fiches et les rapports. Ne modifie rien. Ne voit les identifiants Netflix que si le propriétaire lui en donne l’autorisation explicite. |
| Opérateur | Vendeur ou aide ponctuelle (phase 2) | Crée des clients et des abonnements, enregistre des paiements. Ne voit pas la caisse ni les rapports financiers. |

Le second administrateur est créé comme **Observateur**, ce qui répond à son besoin de consultation. Son passage au rôle Administrateur est une décision du propriétaire (question ouverte Q-02).

### 6.3 Matrice des droits

Légende : ✔ autorisé, ✖ interdit, ◐ autorisé sous condition indiquée.

| Fonction | Propriétaire | Administrateur | Observateur | Opérateur |
| --- | --- | --- | --- | --- |
| Voir le tableau de bord et les KPI | ✔ | ✔ | ✔ | ◐ (activité commerciale seulement) |
| Voir la liste des clients | ✔ | ✔ | ✔ | ✔ |
| Voir le numéro complet d’un client | ✔ | ✔ | ◐ (masqué par défaut, option) | ✔ |
| Créer ou modifier un client | ✔ | ✔ | ✖ | ✔ |
| Voir les comptes Netflix (sans mot de passe) | ✔ | ✔ | ✔ | ✔ |
| Révéler un mot de passe de compte | ✔ | ✔ | ◐ (si autorisé) | ✖ |
| Révéler le code d’un profil | ✔ | ✔ | ◐ (si autorisé) | ✔ (pour livrer un accès) |
| Créer ou modifier un compte, un profil | ✔ | ✔ | ✖ | ✖ |
| Créer un abonnement | ✔ | ✔ | ✖ | ✔ |
| Renouveler ou clôturer un abonnement | ✔ | ✔ | ✖ | ◐ (renouveler seulement) |
| Enregistrer un paiement | ✔ | ✔ | ✖ | ✔ |
| Annuler un paiement | ✔ | ◐ (avec motif) | ✖ | ✖ |
| Enregistrer une recharge | ✔ | ✔ | ✖ | ✖ |
| Enregistrer une sortie de caisse ou un prélèvement | ✔ | ✔ | ✖ | ✖ |
| Faire un pointage de caisse | ✔ | ✔ | ✖ | ✖ |
| Voir la caisse et les prélèvements | ✔ | ✔ | ✔ | ✖ |
| Exporter des données | ✔ | ✔ | ◐ (rapports, sans identifiants) | ✖ |
| Voir le journal d’audit | ✔ | ✔ | ✔ | ✖ |
| Gérer les utilisateurs et les rôles | ✔ | ✖ | ✖ | ✖ |
| Modifier les paramètres et les offres | ✔ | ◐ (offres seulement) | ✖ | ✖ |
| Archiver un enregistrement | ✔ | ✔ | ✖ | ✖ |
| Supprimer définitivement | ✔ | ✖ | ✖ | ✖ |

### 6.4 Exigences

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-USR-01 | Chaque utilisateur possède un compte nominatif avec adresse e-mail unique. | M |
| EXG-USR-02 | Les droits sont contrôlés côté serveur pour chaque requête, jamais seulement côté interface. | M |
| EXG-USR-03 | Le propriétaire peut accorder ou retirer à un Observateur le droit de révéler les identifiants. | M |
| EXG-USR-04 | Le propriétaire peut désactiver un utilisateur immédiatement. Ses sessions sont invalidées. | M |
| EXG-USR-05 | Le dernier propriétaire ne peut ni être désactivé ni perdre son rôle. | M |
| EXG-USR-06 | Le numéro de téléphone d’un client peut être masqué pour un rôle donné. | S |

## 7. Site vitrine public

### 7.1 Rôle du site

Le site vitrine remplit trois fonctions : **informer** (qui est Horizon Service, ce qui est vendu, à quel prix), **rassurer** (comment se déroule l’achat, que faire en cas de problème, quelles sont les conditions) et **convertir** (mener le visiteur vers une conversation WhatsApp avec un message déjà rédigé). Il reprend le message de l’affiche : un compte Netflix à partir de 1 500 FCFA par mois, pour tous les écrans, avec contact par WhatsApp.

### 7.2 Principes de conception et de rédaction

Ces principes découlent des règles d’ingénierie frontend du projet.

- **Partir de la tâche du visiteur.** Il veut savoir combien ça coûte, ce qu’il reçoit, comment payer et à qui parler. L’accueil répond à ces quatre questions sans détour.
- **Contenu réel uniquement.** Aucun faux témoignage, aucun compteur fictif, aucune promesse de disponibilité non tenue. Les chiffres affichés (prix, durées) viennent de la base d’offres.
- **Pas de schéma d’accueil générique.** On évite l’enchaînement habituel badge, grand slogan, deux boutons, illustration abstraite, puis trois cartes de fonctionnalités. La composition est dictée par le contenu : l’offre et ses prix en premier, puis le déroulement concret d’un achat.
- **Rédaction directe.** Les boutons nomment l’action (« Écrire sur WhatsApp »). Les titres décrivent la section. Pas de superlatifs ni de formules vagues.
- **Une seule action principale par écran :** contacter sur WhatsApp. Les actions secondaires (voir les tarifs, lire la FAQ) restent visuellement secondaires.
- **Mobile d’abord.** Le visiteur type arrive depuis un lien partagé sur WhatsApp ou depuis l’affiche, sur un téléphone.
- **Accessible par défaut.** Structure sémantique, contrastes vérifiés, focus visible, alternatives textuelles, respect de la réduction des animations.

### 7.3 Arborescence

| Page | Adresse | Priorité | Objectif |
| --- | --- | --- | --- |
| Accueil | / | M | Présenter l’offre et les prix, mener au contact |
| Offres et tarifs | /offres | M | Détailler chaque formule |
| Comment ça marche | /comment-ca-marche | M | Expliquer l’achat, la réception de l’accès, le renouvellement |
| Questions fréquentes | /faq | M | Lever les objections |
| Contact | /contact | M | Numéros WhatsApp, QR code, horaires |
| Conditions de service | /conditions | M | Règles d’usage, remplacements, expiration |
| Mentions légales et confidentialité | /mentions-legales | M | Cadre légal, données personnelles |
| Page introuvable | /404 | M | Orienter vers l’accueil ou le contact |
| Statut du service | /statut | C | Informer en cas de panne générale (phase 2) |
| Blog ou conseils | /conseils | C | Contenu utile, référencement (phase 2) |

La connexion au tableau de bord est accessible par une adresse distincte (/admin) qui n’est pas liée depuis le menu public. Elle n’est jamais indexée.

### 7.4 Contenu détaillé des pages

#### Accueil

| Bloc | Contenu | Source de la donnée |
| --- | --- | --- |
| En-tête | Logo Horizon Service, navigation, bouton « Écrire sur WhatsApp » | Paramètres |
| Message principal | Ce que le visiteur obtient et à partir de quel prix (1 500 FCFA par mois) | Offres |
| Formules | Tableau des formules actives avec durée, prix et prix par mois | Offres |
| Déroulement | Quatre étapes de l’achat à l’utilisation | Contenu éditorial |
| Ce qui est inclus | Ce que le client reçoit : adresse du compte, profil, code, assistance | Contenu éditorial |
| Renouvellement | Comment et quand le client est prévenu | Contenu éditorial |
| Questions courantes | Cinq questions parmi la FAQ | FAQ |
| Contact | Numéros WhatsApp, QR code | Paramètres |
| Pied de page | Mentions légales, conditions, mention de non-affiliation à Netflix | Paramètres |

#### Offres et tarifs

La page affiche toutes les formules actives, triées par durée. Chaque formule présente le prix total, le prix mensuel équivalent et un bouton de contact qui pré-remplit le nom de la formule dans le message WhatsApp. Une note rappelle que les prix sont en FCFA. La formule longue durée n’apparaît que si elle est active dans la base.

#### Comment ça marche

1. Le visiteur écrit sur WhatsApp et indique la formule souhaitée.
2. Horizon Service confirme la disponibilité et le moyen de paiement.
3. Après paiement, le client reçoit l’adresse du compte, le nom du profil et le code.
4. Quelques jours avant la fin, le client reçoit un rappel pour renouveler.

Chaque étape précise qui agit et dans quel délai. Les délais réels sont à fournir par le fondateur \[À CONFIRMER\].

#### Questions fréquentes

La FAQ est un contenu modifiable depuis le tableau de bord (EXG-VIT-08). Les sujets de départ sont : moyens de paiement, durée d’un abonnement, appareils compatibles, nombre d’écrans, que faire si l’accès ne fonctionne plus, comment renouveler, remplacement en cas de problème, protection des données, relation avec Netflix.

#### Contact

La page affiche les trois numéros de l’affiche, le QR code WhatsApp et les horaires de réponse. Chaque numéro est un lien qui ouvre WhatsApp avec un message pré-rempli. Aucun formulaire n’est proposé au lancement, car WhatsApp est le canal réel de vente.

#### Conditions de service

La page présente en langage simple les règles proposées au fondateur : objet du service, durée, usage personnel du profil, interdiction de modifier les paramètres du compte, remplacement en cas de problème d’accès, absence de remboursement après activation \[À CONFIRMER\], résiliation et expiration. Ces règles sont des propositions. Elles doivent refléter la pratique réelle avant publication.

#### Mentions légales et confidentialité

La page indique l’éditeur, les contacts, l’hébergeur, le traitement des numéros de téléphone (finalité, durée de conservation, droits d’accès et de suppression) et une mention claire : **Horizon Service n’est pas affilié à Netflix, Inc.** La marque Netflix est citée uniquement pour décrire le service proposé.

### 7.5 Exigences fonctionnelles du site

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-VIT-01 | Le site affiche les formules actives depuis la base d’offres, sans prix écrit en dur. | M |
| EXG-VIT-02 | Chaque bouton de contact ouvre WhatsApp avec un message pré-rempli contenant la formule choisie. | M |
| EXG-VIT-03 | Les numéros de contact et le QR code sont modifiables dans les paramètres. | M |
| EXG-VIT-04 | Chaque page possède un titre unique, une description, des balises de partage social et une image de partage aux couleurs de la marque. | M |
| EXG-VIT-05 | Le site génère un plan du site et un fichier d’exclusion pour les robots. La page de connexion est exclue de l’indexation. | M |
| EXG-VIT-06 | La mention de non-affiliation à Netflix apparaît sur toutes les pages (pied de page). | M |
| EXG-VIT-07 | Le site fonctionne sans JavaScript pour le contenu et la navigation, l’amélioration progressive étant réservée aux interactions. | S |
| EXG-VIT-08 | La FAQ et les textes d’aide sont modifiables depuis le tableau de bord par un Administrateur. | S |
| EXG-VIT-09 | Un avis de confidentialité accessible indique l’usage des données et des cookies. Les mesures d’audience sont limitées et sans suivi publicitaire. | M |
| EXG-VIT-10 | Une page 404 renvoie vers l’accueil et le contact. | M |
| EXG-VIT-11 | Le site permet d’ajouter des témoignages réels, uniquement avec l’accord écrit du client, et ne contient aucun témoignage au lancement. | C |
| EXG-VIT-12 | Un bandeau d’information peut être activé (panne, congé, changement de prix). | C |

### 7.6 Exigences de performance, de référencement et d’accessibilité

| ID | Exigence | Valeur de référence |
| --- | --- | --- |
| ENF-VIT-01 | Poids de la page d’accueil, polices et images comprises | 300 Ko maximum, hors image de partage |
| ENF-VIT-02 | Affichage du contenu principal sur un smartphone en 4G | Moins de 2,5 s (indicateur LCP) |
| ENF-VIT-03 | Stabilité de mise en page | CLS inférieur à 0,1, espace réservé aux images |
| ENF-VIT-04 | Images | Format moderne, dimensions déclarées, chargement différé sous la ligne de flottaison |
| ENF-VIT-05 | Polices | 2 familles maximum, 4 graisses maximum, affichage avec police de secours |
| ENF-VIT-06 | Contrastes | Rapport minimal de 4,5:1 pour le texte courant, 3:1 pour les grands textes et composants |
| ENF-VIT-07 | Clavier | Toute action est possible au clavier, le focus est toujours visible |
| ENF-VIT-08 | Mouvement | Les animations respectent la préférence de réduction des mouvements |
| ENF-VIT-09 | Langue | Attribut de langue français, lecteurs d’écran compatibles |
| ENF-VIT-10 | Référencement | Données structurées pour l’organisation et les offres, URL lisibles, balises de titre hiérarchisées |

Le référencement local (Abidjan et Côte d’Ivoire) est traité dans les contenus : le nom du pays et des villes principales apparaît dans les titres et descriptions lorsque c’est exact.

### 7.7 Mots-clés et intentions de recherche \[À CONFIRMER\]

| Intention | Exemple de requête | Page cible |
| --- | --- | --- |
| Acheter | compte Netflix pas cher Côte d’Ivoire | Offres et tarifs |
| Comparer | prix abonnement Netflix en FCFA | Offres et tarifs |
| Comprendre | comment fonctionne un profil Netflix partagé | Comment ça marche |
| Vérifier la confiance | Horizon Service Netflix avis | Accueil, FAQ |
| Résoudre un problème | code de profil Netflix oublié | FAQ |

## 8. Tableau de bord de gestion

Cette section décrit chaque module du tableau de bord. Pour chacun, on précise l’objectif, les utilisateurs, les données manipulées, les exigences et les critères d’acceptation. Les règles de gestion détaillées sont regroupées en section 9.

### 8.1 Authentification et sessions

**Objectif.** Permettre aux utilisateurs autorisés d’accéder au tableau de bord en sécurité, depuis n’importe quel appareil.

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-AUT-01 | Connexion par e-mail et mot de passe. | M |
| EXG-AUT-02 | Les mots de passe utilisateurs sont stockés sous forme de hachage fort et salé, jamais en clair. | M |
| EXG-AUT-03 | Blocage temporaire après 5 échecs consécutifs, avec message neutre qui ne révèle pas si l’adresse existe. | M |
| EXG-AUT-04 | Session expirée après 30 minutes d’inactivité, réglable. Une action sensible demande une nouvelle saisie du mot de passe. | M |
| EXG-AUT-05 | Double authentification par application d’authentification, obligatoire pour le propriétaire et les administrateurs. | S |
| EXG-AUT-06 | Réinitialisation du mot de passe par lien à usage unique valable 30 minutes. | M |
| EXG-AUT-07 | Liste des appareils connectés et déconnexion à distance. | C |
| EXG-AUT-08 | Journalisation des connexions réussies et échouées. | M |

**Critères d’acceptation.** Un utilisateur désactivé ne peut plus se connecter. Un lien de réinitialisation ne fonctionne qu’une fois. Aucun message d’erreur ne révèle l’existence d’un compte. Le formulaire conserve l’adresse saisie après une erreur.

### 8.2 Tableau de bord d’accueil

**Objectif.** Montrer en un coup d’œil ce qui demande une action aujourd’hui et la santé financière du mois.

**Contenu de l’écran, de haut en bas :**

1. **À traiter aujourd’hui** : abonnements échus, abonnements arrivant à échéance dans 3 jours, codes de profil à renouveler. Chaque ligne propose une action directe.
2. **Indicateurs du mois** : chiffre d’affaires, recharge, bénéfice, taux de marge, comparés au mois précédent.
3. **Capacité** : places utilisées et libres par compte.
4. **Évolution** : chiffre d’affaires et bénéfice sur les 12 derniers mois.
5. **Caisse** : caisse théorique, dernier pointage, écart.
6. **Activité récente** : dernières opérations.

La hiérarchie suit l’urgence : ce qui demande une action est en premier, les graphiques viennent ensuite.

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-DAS-01 | Les indicateurs K01 à K12 sont calculés en temps réel et affichés avec leur période. | M |
| EXG-DAS-02 | Le bloc « À traiter » liste les abonnements à terme et échus, triés par date de fin. | M |
| EXG-DAS-03 | Chaque ligne du bloc « À traiter » permet d’ouvrir la fiche, de renouveler ou d’écrire au client sur WhatsApp. | M |
| EXG-DAS-04 | Le sélecteur de période permet : mois en cours, mois précédent, 3 mois, 12 mois, depuis le début. | S |
| EXG-DAS-05 | L’Observateur voit les mêmes indicateurs mais aucune action de modification. | M |
| EXG-DAS-06 | Un état vide explicite s’affiche quand il n’y a rien à traiter. | M |
| EXG-DAS-07 | Les graphiques ont une alternative tabulaire accessible. | S |

### 8.3 Gestion des clients

**Objectif.** Remplacer les numéros de client (« cl 71 ») par de vraies fiches avec historique.

**Données d’une fiche client**

| Champ | Type | Obligatoire | Règle |
| --- | --- | --- | --- |
| Identifiant interne | Identifiant unique | Oui | Généré |
| Nom d’affichage | Texte, 120 caractères | Oui | Ex. prénom ou surnom connu du fondateur |
| Numéro WhatsApp | Numéro international (+225 …) | Oui | Format validé, unique, voir RG-CLI-02 |
| Numéro secondaire | Numéro | Non |  |
| Ancien identifiant | Texte | Non | Conserve « cl 71 », « cl 66 bis » pour la migration |
| Origine | Liste : affiche, recommandation, réseau social, autre | Non | Aide à mesurer l’acquisition |
| Référent | Client existant | Non | Pour les recommandations (« ami de cl 71 ») |
| Consentement de contact | Oui ou non, avec date | Oui | Voir section 20 |
| Notes | Texte libre | Non | Visible selon le rôle |
| Statut | Actif, inactif, bloqué | Oui | Calculé en partie |
| Date de création | Date | Oui | Générée |

**Exigences**

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-CLI-01 | Créer, modifier, archiver une fiche client. | M |
| EXG-CLI-02 | Rechercher par nom, numéro ou ancien identifiant, avec résultats en moins d’une seconde. | M |
| EXG-CLI-03 | Détecter un doublon sur le numéro de téléphone avant l’enregistrement et proposer d’ouvrir la fiche existante. | M |
| EXG-CLI-04 | La fiche affiche tous les abonnements du client, actifs ou terminés, avec leur compte et leur profil. | M |
| EXG-CLI-05 | La fiche affiche l’historique des paiements du client et son total versé. | M |
| EXG-CLI-06 | Un bouton ouvre WhatsApp vers le client, avec ou sans gabarit de message. | M |
| EXG-CLI-07 | Un client ayant des abonnements actifs ne peut pas être supprimé, seulement archivé après clôture. | M |
| EXG-CLI-08 | Fusion de deux fiches clients en cas de doublon, avec journal. | S |
| EXG-CLI-09 | Étiquettes personnalisées (ex. fidèle, à relancer). | C |
| EXG-CLI-10 | Indicateur de fiabilité : nombre de renouvellements, retards de paiement. | C |

**Critères d’acceptation.** Une recherche « 71 » retrouve les deux fiches liées à l’ancien identifiant « cl 71 » et « cl 71 ami ». Un numéro saisi sans indicatif est complété par +225 après confirmation.

### 8.4 Gestion des comptes Netflix

**Objectif.** Centraliser les trois comptes (et les suivants) avec leurs identifiants chiffrés, leur capacité et leur coût.

**Données d’un compte**

| Champ | Type | Règle |
| --- | --- | --- |
| Libellé interne | Texte | Ex. Compte 1 |
| Adresse e-mail du compte | E-mail | Unique |
| Mot de passe | Secret chiffré | Jamais affiché par défaut, jamais écrit dans les journaux |
| Date d’ouverture | Date | Ex. 27/03/2026 |
| Date de prochain réabonnement | Date | Reprend le champ du modèle existant |
| Coût mensuel de recharge | Montant FCFA | Valeur de référence, ajustable |
| Capacité | Entier | 15 par défaut, paramétrable |
| Nombre maximal de profils | Entier | 5 par défaut |
| Statut | Actif, suspendu, fermé |  |
| Notes | Texte |  |

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-CPT-01 | Créer, modifier, suspendre, fermer un compte. | M |
| EXG-CPT-02 | Le mot de passe est chiffré au repos. Il apparaît masqué et se révèle par une action explicite, qui est journalisée. | M |
| EXG-CPT-03 | Un bouton copie le mot de passe sans l’afficher à l’écran. | S |
| EXG-CPT-04 | La fiche compte affiche la capacité, les places utilisées et libres, la liste des profils. | M |
| EXG-CPT-05 | La fiche affiche l’historique des recharges du compte et son coût cumulé. | M |
| EXG-CPT-06 | Une alerte est créée avant la date de réabonnement du compte. | M |
| EXG-CPT-07 | L’historique des changements de mot de passe est conservé sans conserver les anciens mots de passe en clair. | S |
| EXG-CPT-08 | Un compte suspendu bloque l’affectation de nouveaux abonnements mais garde l’historique. | M |
| EXG-CPT-09 | Assistant de remplacement de compte : transférer les abonnements actifs d’un compte vers un autre et générer les messages d’information. | S |

### 8.5 Gestion des profils

**Objectif.** Gérer les cinq profils de chaque compte et la rotation de leurs codes.

**Données d’un profil**

| Champ | Type | Règle |
| --- | --- | --- |
| Compte | Référence | Obligatoire |
| Nom du profil | Texte | Unique dans le compte |
| Code du profil | Secret, 4 chiffres | Chiffré, unique dans le compte, sans suite triviale |
| Capacité | Entier | 3 par défaut, paramétrable, maximum observé de 4 |
| État du code | À jour ou à renouveler | Passe à « à renouveler » lorsqu’un client part |
| Date du dernier changement du code | Date |  |
| Statut | Actif ou désactivé |  |

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-PRO-01 | Créer, renommer, désactiver un profil dans la limite du nombre maximal de profils du compte. | M |
| EXG-PRO-02 | Générer un code aléatoire unique dans le compte, avec rejet des suites (1234, 0000, 1111). | M |
| EXG-PRO-03 | Lorsqu’un abonnement d’un profil se termine, le profil passe à « code à renouveler » si d’autres clients actifs l’utilisent encore ou s’il est réaffecté. | M |
| EXG-PRO-04 | Une tâche « changer le code » est créée avec le nouveau code proposé. Elle est clôturée quand l’utilisateur confirme que le code a été changé dans Netflix. | M |
| EXG-PRO-05 | Les clients actifs du profil sont listés, ainsi que la liste des clients à prévenir du nouveau code. | M |
| EXG-PRO-06 | La capacité du profil est contrôlée à chaque affectation (RG-CAP-03). | M |
| EXG-PRO-07 | Le code n’est jamais affiché dans une liste, seulement dans la fiche, après action explicite. | M |

### 8.6 Gestion des offres

**Objectif.** Piloter les formules et les prix sans modifier le code.

| Champ | Type | Exemple |
| --- | --- | --- |
| Nom | Texte | Mensuelle |
| Durée en mois | Entier | 1 |
| Prix en FCFA | Entier | 1 500 |
| Visible sur le site | Oui ou non | Oui |
| Active à la vente | Oui ou non | Oui |
| Ordre d’affichage | Entier | 1 |
| Description courte | Texte |  |

| ID | Exigence | Priorité |
| --- | --- | --- |
| EXG-OFF-01 | Créer, modifier, désactiver une offre. Les offres désactivées restent visibles dans l’historique. | M |
| EXG-OFF-02 | Le prix mensuel équivalent est calculé et affiché. | M |
| EXG-OFF-03 | Un changement de prix ne modifie jamais les abonnements existants : le tarif est copié dans l’abonnement à la création. | M |
| EXG-OFF-04 | Les offres initiales sont : mensuelle (1 mois, 1 500), bimestrielle (2 mois, 3 000), trimestrielle (3 mois, 4 500). La formule longue durée (environ 7 mois, 10 000) est créée comme offre sur mesure. | M |
| EXG-OFF-05 | Une durée personnalisée avec prix saisi est possible, avec motif obligatoire. | S |
