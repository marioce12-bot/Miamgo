# Cahier des charges - Miamgo

## 1. Vision

Miamgo permet aux restaurants, petits comme grands, de créer leur boutique de repas en ligne, de recevoir et gérer leurs commandes, et de proposer une livraison interne ou via des livreurs partenaires. Les clients découvrent des restaurants et des plats dans un fil personnalisé, commandent et suivent la préparation ou la livraison.

La plateforme démarre dans les pays de la CEDEAO, avec une conception adaptée aux usages mobiles, au paiement local et à WhatsApp.

## 2. Objectifs

- Donner à chaque restaurant une vitrine numérique simple à administrer.
- Permettre la commande de plusieurs plats dans un même panier.
- Sécuriser le retrait et la livraison grâce à des codes QR et numéros de commande.
- Proposer une expérience de découverte personnalisée aux clients.
- Générer des revenus par abonnements, sans commission sur les commandes.
- Faciliter l'accès des restaurants sans livreurs à un réseau de livreurs ou d'agences partenaires.

## 3. Utilisateurs et rôles

| Rôle | Description |
| --- | --- |
| Client | Recherche, découvre, commande, paie et suit ses commandes. |
| Administrateur de restaurant | Crée sa boutique, ses menus, ses promotions, gère les commandes, les livreurs et ses statistiques. |
| Employé de restaurant | Consulte et valide les commandes via scan QR, selon les droits attribués. |
| Livreur interne | Est rattaché à un seul restaurant et réalise exclusivement ses livraisons. |
| Livreur partenaire | Est rattaché à une agence ou au réseau Miamgo, reçoit et accepte des demandes de course. |
| Agence de livraison | Gère ses livreurs affiliés et paie son abonnement. |
| Administrateur Miamgo | Modère la plateforme, gère les abonnements, les agences, les contenus mis en avant et les incidents. |
| Agent IA | Assistant conversationnel du restaurant disponible avec le plan Premium. |

## 4. Offres d'abonnement

Les prix sont exprimés dans la devise locale configurée par pays (FCFA par défaut). Aucun pourcentage n'est prélevé sur les commandes.

| Plan | Prix mensuel | Fonctionnalités |
| --- | ---: | --- |
| Basique | 2 500 FCFA | Boutique en ligne, menu, prix, photos, plats du jour, promotions, gestion des commandes, retrait QR, statistiques journalières simples. |
| Pro | 5 000 FCFA | Tout le plan Basique, statistiques complètes (jour, mois, année), export des commandes, gestion des employés et livreurs internes, promotions programmées, mise en avant locale et alertes de stock/indisponibilité. |
| Premium IA | 12 000 FCFA | Tout le plan Pro, agent IA du restaurant, recommandations intelligentes, réponses automatisées sur le menu, les prix, horaires et livraisons, aide à la prise de commande. |
| Agence partenaire | 3 000 FCFA | Fiche agence, présence de ses livreurs disponibles dans le réseau partenaire, gestion des profils et de l'historique de ses livreurs. |

Le plan Pro apporte une valeur opérationnelle concrète avant l'IA: pilotage commercial, équipe, livreurs, visibilité et automatisation des promotions.

## 5. Boutique restaurant

### 5.1 Inscription et configuration

Le restaurant renseigne:

- Nom commercial, logo, description, catégorie et coordonnées.
- Adresse, position géographique, zone de service et horaires d'ouverture.
- Numéro de téléphone et canal WhatsApp.
- Compte de paiement destinataire configuré avec FedaPay.
- Type de livraison: aucune, livraison interne, ou recours au réseau partenaire.
- Paramètres de retrait sur place et délai moyen de préparation.

La boutique possède une URL publique, une page de présentation et un statut ouvert, fermé ou indisponible temporairement.

### 5.2 Menus et disponibilité

Un restaurant peut créer des catégories, plats, suppléments et variantes. Chaque plat contient au minimum un nom, un prix, une description, une photo facultative et un statut de disponibilité.

Le restaurant peut:

- Créer des menus permanents.
- Créer un plat du jour avec une date de début et de fin.
- Rendre visible uniquement le plat proposé aujourd'hui (exemple: riz aujourd'hui, spaghetti demain).
- Programmer des promotions avec prix réduit, période de validité et quantité limitée.
- Mettre un plat en rupture ou le retirer temporairement de la vente.

## 6. Parcours client

### 6.1 Découverte et recherche

L'accueil présente un fil d'actualités avec les nouveaux restaurants, plats, promotions et contenus sponsorisés clairement identifiés. Le fil se personnalise progressivement selon les recherches, clics, favoris, commandes, localisation et préférences alimentaires du client.

La recherche doit accepter le nom d'un restaurant, d'un plat ou d'une catégorie. Les résultats mettent en avant les correspondances pertinentes et proposent une section "Vous aimerez aussi" fondée sur des plats, restaurants et préférences similaires.

### 6.2 Panier et commande

Le client peut commander plusieurs plats d'un même restaurant dans un panier. Une commande ne mélange pas les produits de plusieurs restaurants.

Au paiement, le client choisit:

- Retrait sur place.
- Livraison à sa propre adresse.
- Livraison à une autre personne, avec son nom, son téléphone et son adresse.

Pour une livraison à une autre personne, aucun QR code destinataire n'est requis: la remise est validée à partir du numéro de téléphone renseigné et des informations de la commande.

### 6.3 Paiement

Le paiement des repas est réalisé via FedaPay, directement vers le compte de paiement configuré par le restaurant. La plateforme ne prélève pas de commission sur la valeur des plats.

Le prix de livraison est affiché avant la confirmation de commande. Pour une livraison partenaire, il peut être encaissé en espèces par le livreur à la remise, selon les règles définies dans la section livraison.

## 7. Gestion des commandes

Chaque commande reçoit un identifiant lisible et unique, par exemple `MG-20260807-0042`, ainsi qu'un QR code signé et à durée limitée lorsque nécessaire.

### 7.1 Statuts

`En attente de paiement` -> `Payée` -> `Acceptée` -> `En préparation` -> `Prête` -> `En livraison` ou `À retirer` -> `Terminée`.

Les statuts alternatifs sont `Annulée`, `Refusée`, `Expirée` et `Litige signalé`.

Le tableau de bord restaurant sépare les commandes en cours, terminées et l'historique. Chaque fiche affiche le numéro de commande, client/destinataire, téléphone, adresse, articles, montant, heure, type de remise et historique des statuts.

### 7.2 Retrait sur place

Après paiement, le client reçoit le numéro et le QR code de sa commande. À l'arrivée, un employé autorisé scanne le code depuis l'application restaurant. Le scan valide uniquement une commande payée, prête et non déjà remise, puis affiche son numéro sur le téléphone de l'employé avant la remise.

### 7.3 Livraison interne

Le restaurant affecte un de ses livreurs internes à une commande. Le livreur ouvre un lien sécurisé, confirme la prise en charge puis démarre la livraison. Le restaurant visualise les statuts et, avec accord du livreur, sa position sur une carte durant la course.

À destination, le livreur scanne le QR code du client. Le système doit vérifier que le QR correspond à la commande et au livreur affecté avant de valider la remise. Un QR invalide, expiré ou appartenant à une autre commande ne valide rien. Pour une commande destinée à un tiers, la vérification se fait par le téléphone du destinataire et le code/numéro de commande communiqué.

## 8. Livreurs et agences partenaires

### 8.1 Livreurs internes

Un livreur interne appartient à un seul restaurant. Le restaurant lui envoie un lien d'inscription permettant de renseigner nom, prénom, téléphone et sexe. Une fois validé, le livreur apparaît dans la section "Livreurs" avec son statut libre, occupé, indisponible ou désactivé.

La fiche livreur indique le nombre de courses prises, les courses en cours et son historique. La suppression ou désactivation révoque immédiatement ses sessions, ses liens actifs et sa capacité à accepter de nouvelles courses.

### 8.2 Réseau partenaire

Un restaurant sans livraison interne peut choisir, lors de l'inscription, d'accéder au réseau de livreurs Miamgo et aux agences affiliées. Lorsqu'une commande doit être livrée, il voit les livreurs disponibles selon la zone et peut:

- Envoyer une demande de livraison dans l'application.
- Recevoir l'acceptation ou le refus du livreur.
- Contacter le livreur via WhatsApp avec un bouton dédié.

L'acceptation passe d'abord par une notification mobile afin de tracer la demande. Le lien WhatsApp est un canal complémentaire, pas le seul moyen d'affectation.

## 9. Tarification et suivi de livraison

Le tarif de livraison doit être calculé automatiquement à partir de la géolocalisation du restaurant et de l'adresse du client géocodée. Il ne doit pas être librement défini par le livreur.

Formule initiale recommandée:

`frais = tarif de prise en charge + (distance routière en km x tarif au km) + majoration optionnelle`

Les paramètres sont configurables par ville, zone ou agence: tarif de base, prix au kilomètre, distance maximale, minimum de commande et majoration nuit/pluie si applicable. Le montant affiché au client est verrouillé à l'acceptation de la commande. Toute modification nécessite l'accord explicite du client avant le départ du livreur.

Le suivi carte commence lorsque le livreur accepte puis démarre la course. Il affiche une position actualisée à intervalle raisonnable, la progression et le statut de livraison. La collecte de position est limitée à la course active, explicitement consentie et arrêtée à la fin de la livraison.

## 10. Agent IA Premium

L'agent IA représente le restaurant dans le chat client. Il est alimenté exclusivement par les données validées du restaurant: menus disponibles, plats du jour, ingrédients/allergènes renseignés, prix, promotions, horaires, zones, délais de préparation et modalités de livraison.

Il peut:

- Répondre aux questions comme un employé du restaurant.
- Recommander des plats selon les préférences et le contexte de la demande.
- Expliquer les prix, promotions, horaires et disponibilité.
- Guider le client vers le panier et préremplir une intention de commande.

Il ne peut pas inventer un plat, un prix, une promotion, un délai ou une allergie. Les actions engageantes (paiement, annulation, changement d'adresse) restent confirmées par le client. Une option de transfert vers le restaurant doit être disponible.

## 11. Tableau de bord et statistiques

Le restaurant dispose de statistiques journalières, mensuelles et annuelles:

- Chiffre d'affaires brut et commandes payées.
- Nombre de commandes, panier moyen et plats les plus vendus.
- Répartition retrait/livraison.
- Promotions utilisées et annulations.
- Performance des livreurs: courses acceptées, terminées, temps moyen et historique.

Les montants de livraison sont distincts des ventes de plats afin de rendre les revenus du restaurant lisibles.

## 12. Règles métier et litiges

- Le restaurant est responsable de la préparation, qualité, disponibilité et gestion des litiges liés aux produits.
- Miamgo agit comme intermédiaire technique et n'est pas responsable de la qualité des repas, des retards du restaurant ni des litiges commerciaux entre client et restaurant.
- Les politiques d'annulation, remboursement et réclamation du restaurant doivent être visibles avant paiement.
- Chaque changement de statut, affectation de livreur, scan et tentative de validation est journalisé avec date, acteur et référence de commande.
- Un restaurant fermé ne peut pas recevoir de nouvelle commande, sauf planification future explicitement activée.

## 13. Exigences non fonctionnelles

- Application mobile-first et interface web responsive.
- Langue initiale: français; architecture prête pour l'anglais et les langues locales.
- Données personnelles minimisées, chiffrées en transit et protégées au repos.
- Authentification sécurisée, rôles et permissions strictes.
- QR codes signés, à usage unique après validation, avec contrôle de l'expiration.
- Journalisation des paiements, scans et décisions de livraison pour audit.
- Conformité aux exigences de FedaPay; les données de carte ne transitent jamais par Miamgo.
- Carte, calcul d'itinéraires, géocodage et position temps réel fournis par un prestataire cartographique compatible avec les pays ciblés.

## 14. Architecture cible

| Domaine | Responsabilité |
| --- | --- |
| Application client | Découverte, recherche, panier, paiement, QR client, suivi de commande. |
| Espace restaurant | Boutique, catalogue, commandes, équipes, livreurs, statistiques et IA. |
| Application livreur | Disponibilité, notifications, prise en charge, navigation, scan et historique. |
| API métier | Utilisateurs, rôles, commandes, règles tarifaires, notifications et audits. |
| Paiement | Intégration FedaPay avec webhooks vérifiés côté serveur. |
| Cartographie | Géocodage, calcul de distance routière, itinéraire et suivi temps réel. |
| Notifications | Push mobile, SMS/WhatsApp en complément, e-mails transactionnels si nécessaire. |
| IA | Base de connaissance par restaurant, garde-fous et traçabilité des conversations. |

## 15. Modèle de données minimal

- `User`, `CustomerProfile`, `Restaurant`, `RestaurantMember` et `Subscription`.
- `MenuCategory`, `MenuItem`, `Modifier`, `DailySpecial` et `Promotion`.
- `Cart`, `Order`, `OrderItem`, `Payment`, `OrderStatusHistory` et `PickupToken`.
- `Delivery`, `DeliveryAssignment`, `Driver`, `Agency`, `DriverLocation` et `DeliveryPricingRule`.
- `Address`, `GeoPoint`, `Notification`, `Conversation`, `AiKnowledgeSource` et `AuditLog`.

## 16. Feuille de route

### Phase 1 - MVP commercial

- Inscription client et restaurant.
- Boutique, menus, plats du jour, promotions et recherche.
- Panier mono-restaurant, paiement FedaPay et commandes.
- Retrait sur place avec numéro de commande et QR code.
- Tableau de bord commandes et statistiques journalières.
- Plans Basique et Pro.

### Phase 2 - Livraison et pilotage

- Livreurs internes, invitation, disponibilité, historique et désactivation.
- Géolocalisation, calcul du prix de livraison et suivi de course.
- Réseau/agences partenaires, notifications d'affectation et contact WhatsApp.
- Statistiques mensuelles et annuelles, exports et promotions programmées.

### Phase 3 - Intelligence et personnalisation

- Fil personnalisé et recommandations.
- Agent IA Premium connecté au catalogue et aux paramètres restaurant.
- Mise en avant contrôlée de nouveautés et restaurants.
- Optimisation des règles de tarification et des zones de livraison selon les données réelles.

## 17. Indicateurs de succès

- Restaurants actifs et taux de renouvellement des abonnements.
- Commandes terminées et valeur moyenne par commande.
- Taux de paiement réussi et de retrait/livraison validé.
- Délai moyen de préparation et livraison.
- Taux d'acceptation des courses et disponibilité des livreurs.
- Usage de l'agent IA, taux de résolution et conversion en commande.
- Satisfaction client et nombre de litiges par restaurant.
