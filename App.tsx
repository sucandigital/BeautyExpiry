// --- BILLING IMPORTS (v12 kompatibel) ---
import {
  initConnection,
  getProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  endConnection
} from "react-native-iap";

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, 
  Modal, Alert, Image, StatusBar, Platform
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, Plus, Settings, Search, ChevronRight, X, Sparkles, 
  Camera, Image as ImageIcon, Trash2, Globe, Folder, Lock, 
  Calendar, Edit2, ArrowLeft, Bell, ArrowUpDown, Check,
  Download, FileText, Palette, Copy, CheckCircle,
  ArrowRight, RefreshCcw
} from 'lucide-react-native';


// --- BILLING IMPORTS (FIXED) ---
// Wir importieren alles als Objekt, um TS-Fehler zu umgehen und Laufzeitfehler zu vermeiden


// Wir entpacken die Funktionen sicherheitshalber


// --- TYPES ---
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  openedDate: string;
  pao: number;
  expiryDate: string;
  imageUri: string | null;
  notes: string;
  notificationOffsets: number[];
  notificationIds: string[];
}

// --- KONFIGURATION ---
const PRODUCT_ID = 'premium_unlock'; 
const productIds = [PRODUCT_ID];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false } as any),
});

// --- THEMES ---
const THEMES = {
  beige: { label: "Beige (Standard)", colors: { bg: '#F5F1EC', card: 'rgba(255, 255, 255, 0.95)', text: '#000000', subText: '#666666', fresh: '#32CD32', warning: '#FFA500', expired: '#FF4C4C', gold: '#C7A05F', border: '#E5E5E5', tint: '#000000', input: '#FFFFFF' }, premium: false },
  dark:  { label: "Dark Mode", colors: { bg: '#121214', card: '#1E1E20', text: '#FFFFFF', subText: '#A1A1AA', fresh: '#4ADE80', warning: '#FACC15', expired: '#F87171', gold: '#FFD700', border: '#27272A', tint: '#FFFFFF', input: '#27272A' }, premium: false },
  rose:  { label: "Rose Gold", colors: { bg: '#FAF6F4', card: '#FFFFFF', text: '#4A3B32', subText: '#8D7B6F', fresh: '#66BB6A', warning: '#FFA726', expired: '#EF5350', gold: '#D9917E', border: '#F6D3C8', tint: '#D9917E', input: '#FFF0E8' }, premium: true },
  blue:  { label: "Ocean Blue", colors: { bg: '#F0F4F8', card: '#FFFFFF', text: '#102A43', subText: '#627D98', fresh: '#27AB83', warning: '#F0B429', expired: '#E12D39', gold: '#334E68', border: '#D9E2EC', tint: '#40C3F7', input: '#FFFFFF' }, premium: true },
  green: { label: "Mint Fresh", colors: { bg: '#E8F5E9', card: '#FFFFFF', text: '#1B5E20', subText: '#4CAF50', fresh: '#43A047', warning: '#FDD835', expired: '#E53935', gold: '#2E7D32', border: '#C8E6C9', tint: '#00C853', input: '#FFFFFF' }, premium: true },
  purple:{ label: "Royal Purple", colors: { bg: '#F3E5F5', card: '#FFFFFF', text: '#4A148C', subText: '#8E24AA', fresh: '#66BB6A', warning: '#FFA726', expired: '#AB47BC', gold: '#7B1FA2', border: '#E1BEE7', tint: '#AA00FF', input: '#FFFFFF' }, premium: true },
};
type ThemeKey = keyof typeof THEMES;

// --- LEGAL TEXTS ---
const privacyEn = "Privacy Policy\n\n1. General & Local Storage\nThis app ('BeautyExpiry') processes personal data exclusively locally on your device. No data is transferred to external servers. You retain full control over your data.\n\n2. Processed Data\nWe only store data you actively enter (Product Data, Images, Settings).\n\n3. Permissions\n• Camera: Solely for taking product photos.\n• Gallery: To import existing photos.\n• Notifications: Local reminders.\n\n4. Liability\nThe app serves solely for documentation. We assume no liability for skin irritations or actual shelf life.\n\n5. Your Rights\nExercise your rights directly on your device.";
const termsEn = "Terms & Conditions\n\n1. Scope\n'BeautyExpiry' is a local tracking tool.\n\n2. Premium\nOne-time purchase unlocks unlimited products, exports, and themes.\n\n3. Liability\nUse at your own risk. We are not liable for expired products.\n\n4. Payment\nProcessed via App Store.\n\n5. Availability\nOffline functionality.";

const LEGAL_TEXTS: any = {
    privacy: {
        de: "Datenschutzerklärung\n\n1. Allgemeines & Lokale Speicherung\nDiese App („BeautyExpiry“) verarbeitet personenbezogene Daten ausschließlich lokal auf Ihrem Endgerät. Es erfolgt keine Übertragung von Daten an externe Server.\n\n2. Verarbeitete Daten\nDie App speichert nur Daten, die Sie aktiv eingeben (Produktdaten, Bilder, Einstellungen).\n\n3. Berechtigungen\n• Kamera: Zum Fotografieren von Produkten.\n• Galerie: Zum Importieren von Bildern.\n• Benachrichtigungen: Für lokale Erinnerungen.\n\n4. Haftungsausschluss\nDie App dient der Dokumentation. Wir haften nicht für Hautirritationen oder die tatsächliche Haltbarkeit.\n\n5. Ihre Rechte\nDa keine Daten auf Servern liegen, haben Sie die volle Kontrolle auf Ihrem Gerät.",
        en: privacyEn,
        es: privacyEn, fr: privacyEn, it: privacyEn, pt: privacyEn, tr: privacyEn
    },
    terms: {
        de: "Allgemeine Geschäftsbedingungen (AGB)\n\n1. Vertragsgegenstand\nTracking-App zur lokalen Dokumentation.\n\n2. Premium-Funktionen\nEinmaliger Kauf für unbegrenzte Produkte & Export.\n\n3. Haftung\nNutzung auf eigene Verantwortung. Keine Haftung für verdorbene Produkte.\n\n4. Zahlung\nAbwicklung über den App Store.\n\n5. Verfügbarkeit\nOffline-App.",
        en: termsEn,
        es: termsEn, fr: termsEn, it: termsEn, pt: termsEn, tr: termsEn
    }
};
// --- TRANSLATIONS ---

// 1. Englisch (Basis)
const enTranslations = {
    dashboard: "Dashboard", add: "Add", settings: "Settings", searchPlaceholder: "Search products...",
    emptyStateText: "No products found.", emptyStateSub: "Press + to add one.",
    fresh: "Fresh", expiringSoon: "Expiring soon", expired: "Expired",
    daysLeft: "{{days}} days left", expiredDaysAgo: "Expired {{days}} days ago", expiresOn: "Expires: {{date}}",
    newProduct: "New Product", editProduct: "Edit Product", nameLabel: "Product Name *", brandLabel: "Brand",
    categoryLabel: "Category *", openedLabel: "Opened Date (DD.MM.YYYY) *", paoLabel: "Shelf Life (Months) *",
    notesLabel: "Notes", remindersLabel: "Reminders", save: "Save", camera: "Camera", gallery: "Gallery",
    removeImage: "Remove Image", custom: "Custom", appearance: "APPEARANCE", language: "Language", theme: "Theme",
    premiumContent: "CONTENT (PREMIUM)", manageCategories: "Manage Categories", exportData: "Export & Backup",
    exportCSV: "Export as CSV", exportPDF: "Export as PDF",
    otherOptions: "MORE OPTIONS", deleteExpired: "Remove expired", deleteAll: "Remove all products",
    privacy: "Privacy Policy", terms: "Terms & Conditions",
    premiumActive: "✅ Premium Active", unlockPremium: "Unlock Premium", restorePurchase: "Restore Purchases",
    devTools: "DEVELOPER TOOLS", resetPremium: "DEBUG: Remove Premium", premiumTitle: "Unlock Premium",
    upgradeBtn: "Upgrade for 3,99 €",
    cat_makeup: "Make-Up", cat_skincare: "Skincare", cat_haircare: "Haircare", cat_perfume: "Perfume",
    sortExpiry: "By Expiry", sortName: "By Name", all: "All", new: "+ New",
    errorName: "Name required", errorDate: "Invalid date. Format: DD.MM.YYYY", errorPao: "Please enter valid months",
    limitReached: "Unlock Unlimited Products", 
    premiumFeature: "Unlock Premium Features",
    deleteTitle: "Delete", deleteMsg: "Really delete?", deleteExpiredMsg: "Really remove all expired products?",
    deleteAllMsg: "Really remove ALL products? This cannot be undone.",
    cancel: "Cancel", delete: "Delete", openedOn: "Opened on", shelfLife: "Shelf Life", expiryDate: "Expiry Date",
    notesTitle: "NOTES", remind_0: "On expiry day", remind_1: "1 day before", remind_3: "3 days before",
    remind_7: "1 week", remind_14: "2 weeks", remind_30: "1 month", catExists: "Category already exists.",
    newCatPlaceholder: "Category Name...", myCategories: "CUSTOM CATEGORIES", stdCategories: "STANDARD CATEGORIES",
    noCustomCats: "No custom categories.", notificationTitle: "Product expiring!",
    notificationBody: "{{name}} is expiring soon!", thankYou: "Thank you!", premiumActivated: "You now have access to all premium features.",
    resetMsg: "Premium status removed.", exportSuccess: "Export successfully created.",
    legalDisclaimer: "Disclaimer: No medical advice.", close: "Close", duplicate: "Duplicate", duplicateUnlock: "Unlock Duplication",
    unlockNotifications: "Unlock Custom Notifications",
    successTitle: "Premium Activated! 🎉",
    successBody: "Thanks for your purchase. You now have access to:\n\n✅ Unlimited Products\n✅ Advanced Reminders\n✅ CSV & PDF Export\n✅ Premium Themes\n✅ Custom Categories\n✅ Duplicate Function",
    featuresList: ["Add unlimited products", "Multiple reminders", "Create custom categories", "Export as PDF & CSV", "All Premium Themes", "Duplicate products"],
    welcomeTitle: "Welcome to BeautyExpiry",
    welcomeText: "Manage your cosmetics, keep track of expiry dates and avoid waste.",
    startBtn: "Get Started",
    onboard1: "Track & organize products",
    onboard2: "Get reminders before expiry",
    onboard3: "Keep your routine fresh",
    version: "Version 1.0.0"
};

// 2. Deutsch
const deTranslations = {
    dashboard: "Dashboard", add: "Hinzufügen", settings: "Einstellungen", searchPlaceholder: "Suche Produkte...",
    emptyStateText: "Keine Produkte gefunden.", emptyStateSub: "Drücke auf + um eins hinzuzufügen.",
    fresh: "Frisch", expiringSoon: "Bald ablaufend", expired: "Abgelaufen",
    daysLeft: "Noch {{days}} Tage", expiredDaysAgo: "Seit {{days}} Tagen abgelaufen", expiresOn: "Ablauf: {{date}}",
    newProduct: "Neues Produkt", editProduct: "Bearbeiten", nameLabel: "Produkt Name *", brandLabel: "Marke",
    categoryLabel: "Kategorie *", openedLabel: "Öffnungsdatum (TT.MM.JJJJ) *", paoLabel: "Haltbarkeit (Monate) *",
    notesLabel: "Notizen", remindersLabel: "Erinnerungen", save: "Speichern", camera: "Kamera", gallery: "Galerie",
    removeImage: "Bild entfernen", custom: "Eigen", appearance: "DARSTELLUNG", language: "Sprache", theme: "Design",
    premiumContent: "INHALTE (PREMIUM)", manageCategories: "Kategorien verwalten", exportData: "Export & Backup",
    exportCSV: "Als CSV exportieren", exportPDF: "Als PDF exportieren", 
    otherOptions: "WEITERE OPTIONEN", deleteExpired: "Abgelaufene entfernen", deleteAll: "Alle Produkte entfernen",
    privacy: "Datenschutz", terms: "AGB",
    premiumActive: "✅ Premium Aktiv", unlockPremium: "Premium freischalten", restorePurchase: "Käufe wiederherstellen",
    devTools: "ENTWICKLER TOOLS", resetPremium: "DEBUG: Premium entfernen", premiumTitle: "Premium freischalten",
    upgradeBtn: "Upgrade für 3,99 €",
    cat_makeup: "Make-Up", cat_skincare: "Hautpflege", cat_haircare: "Haarpflege", cat_perfume: "Parfüm",
    sortExpiry: "Nach Ablauf", sortName: "Nach Name", all: "Alle", new: "+ Neu",
    errorName: "Name erforderlich", errorDate: "Ungültiges Datum. Format: TT.MM.JJJJ", errorPao: "Bitte gültige Monate eingeben",
    limitReached: "Unbegrenzte Produkte freischalten", 
    premiumFeature: "Erweiterte Funktionen freischalten",
    deleteTitle: "Löschen", deleteMsg: "Wirklich löschen?", deleteExpiredMsg: "Möchtest du wirklich alle abgelaufenen Produkte löschen?",
    deleteAllMsg: "Möchtest du wirklich ALLE Produkte löschen? Das kann nicht rückgängig gemacht werden.",
    cancel: "Abbrechen", delete: "Löschen", openedOn: "Geöffnet am", shelfLife: "Haltbarkeit", expiryDate: "Ablaufdatum",
    notesTitle: "NOTIZEN", remind_0: "Am Ablauftag", remind_1: "1 Tag vorher", remind_3: "3 Tage vorher",
    remind_7: "1 Woche", remind_14: "2 Wochen", remind_30: "1 Monat", catExists: "Kategorie existiert bereits.",
    newCatPlaceholder: "Kategorie Name...", myCategories: "EIGENE KATEGORIEN", stdCategories: "STANDARD KATEGORIEN",
    noCustomCats: "Keine eigenen Kategorien.", notificationTitle: "Produkt läuft ab!",
    notificationBody: "{{name}} läuft bald ab!", thankYou: "Vielen Dank!", premiumActivated: "Du hast jetzt Zugriff auf alle Premium-Funktionen.",
    resetMsg: "Premium Status wurde entfernt.", exportSuccess: "Export erfolgreich erstellt.",
    legalDisclaimer: "Haftungsausschluss: Keine medizinische Beratung.",
    close: "Schließen", duplicate: "Duplizieren", duplicateUnlock: "Duplizieren freischalten",
    unlockNotifications: "Mehrere Erinnerungen freischalten",
    successTitle: "Premium Aktiviert! 🎉",
    successBody: "Danke für deinen Kauf. Du hast jetzt Zugriff auf:\n\n✅ Unbegrenzte Produkte\n✅ Erweiterte Erinnerungen\n✅ CSV & PDF Export\n✅ Premium Themes\n✅ Eigene Kategorien\n✅ Duplizieren-Funktion",
    featuresList: ["Unbegrenzt Produkte hinzufügen", "Mehrere Erinnerungen gleichzeitig", "Eigene Kategorien erstellen", "Export als PDF & CSV", "Alle Premium-Themes", "Produkte duplizieren"],
    welcomeTitle: "Willkommen bei BeautyExpiry",
    welcomeText: "Verwalte deine Kosmetikprodukte, behalte den Überblick über Ablaufdaten und vermeide Müll.",
    startBtn: "Jetzt starten",
    onboard1: "Produkte scannen & erfassen",
    onboard2: "Erinnerungen vor Ablauf erhalten",
    onboard3: "Ordnung in deinem Badezimmer",
    version: "Version 1.0.0"
};

// 3. Spanisch (Español)
const es = {
    ...enTranslations, // Fallback
    dashboard: "Panel", add: "Añadir", settings: "Ajustes", searchPlaceholder: "Buscar productos...",
    emptyStateText: "No se encontraron productos.", emptyStateSub: "Pulsa + para añadir uno.",
    fresh: "Fresco", expiringSoon: "Caduca pronto", expired: "Caducado",
    daysLeft: "Quedan {{days}} días", expiredDaysAgo: "Caducado hace {{days}} días", expiresOn: "Caduca: {{date}}",
    newProduct: "Nuevo Producto", editProduct: "Editar Producto", nameLabel: "Nombre del producto *", brandLabel: "Marca",
    categoryLabel: "Categoría *", openedLabel: "Fecha apertura (DD.MM.AAAA) *", paoLabel: "Duración (Meses) *",
    notesLabel: "Notas", remindersLabel: "Recordatorios", save: "Guardar", camera: "Cámara", gallery: "Galería",
    removeImage: "Eliminar imagen", custom: "Personalizado", appearance: "APARIENCIA", language: "Idioma", theme: "Tema",
    premiumContent: "CONTENIDO (PREMIUM)", manageCategories: "Gestionar Categorías", exportData: "Exportar y Copia",
    exportCSV: "Exportar como CSV", exportPDF: "Exportar como PDF",
    otherOptions: "OTRAS OPCIONES", deleteExpired: "Borrar caducados", deleteAll: "Borrar todo",
    privacy: "Privacidad", terms: "Términos",
    premiumActive: "✅ Premium Activo", unlockPremium: "Desbloquear Premium", restorePurchase: "Restaurar Compras",
    premiumTitle: "Desbloquear Premium", upgradeBtn: "Mejorar por 3,99 €",
    cat_makeup: "Maquillaje", cat_skincare: "Cuidado Piel", cat_haircare: "Cabello", cat_perfume: "Perfume",
    sortExpiry: "Por caducidad", sortName: "Por nombre", all: "Todo", new: "+ Nuevo",
    errorName: "Nombre obligatorio", errorDate: "Fecha inválida", errorPao: "Meses inválidos",
    limitReached: "Desbloquear productos ilimitados",
    deleteTitle: "Eliminar", deleteMsg: "¿Eliminar realmente?",
    cancel: "Cancelar", delete: "Eliminar", openedOn: "Abierto el", shelfLife: "Vida útil", expiryDate: "Fecha caducidad",
    remind_0: "El día de caducidad", remind_1: "1 día antes", remind_3: "3 días antes", remind_7: "1 semana", remind_14: "2 semanas", remind_30: "1 mes",
    notificationTitle: "¡Producto caducando!", notificationBody: "¡{{name}} caduca pronto!",
    welcomeTitle: "Bienvenido a BeautyExpiry", welcomeText: "Gestiona tus cosméticos y evita el desperdicio.", startBtn: "Empezar",
    onboard1: "Rastrear y organizar productos", onboard2: "Recibe recordatorios", onboard3: "Mantén tu rutina fresca"
};

// 4. Französisch (Français)
const fr = {
    ...enTranslations,
    dashboard: "Tableau de bord", add: "Ajouter", settings: "Paramètres", searchPlaceholder: "Rechercher...",
    emptyStateText: "Aucun produit trouvé.", emptyStateSub: "Appuyez sur + pour ajouter.",
    fresh: "Frais", expiringSoon: "Expire bientôt", expired: "Expiré",
    daysLeft: "Reste {{days}} jours", expiredDaysAgo: "Expiré il y a {{days}} jours", expiresOn: "Expire : {{date}}",
    newProduct: "Nouveau produit", editProduct: "Modifier", nameLabel: "Nom du produit *", brandLabel: "Marque",
    categoryLabel: "Catégorie *", openedLabel: "Date d'ouverture (JJ.MM.AAAA) *", paoLabel: "Durée (Mois) *",
    notesLabel: "Notes", remindersLabel: "Rappels", save: "Enregistrer", camera: "Caméra", gallery: "Galerie",
    removeImage: "Supprimer l'image", custom: "Perso", appearance: "APPARENCE", language: "Langue", theme: "Thème",
    premiumContent: "CONTENU (PREMIUM)", manageCategories: "Gérer les catégories", exportData: "Export & Sauvegarde",
    exportCSV: "Exporter en CSV", exportPDF: "Exporter en PDF",
    otherOptions: "AUTRES OPTIONS", deleteExpired: "Supprimer expirés", deleteAll: "Tout supprimer",
    privacy: "Confidentialité", terms: "Conditions",
    premiumActive: "✅ Premium Actif", unlockPremium: "Débloquer Premium", restorePurchase: "Restaurer les achats",
    premiumTitle: "Débloquer Premium", upgradeBtn: "Mettre à niveau 3,99 €",
    cat_makeup: "Maquillage", cat_skincare: "Soins peau", cat_haircare: "Cheveux", cat_perfume: "Parfum",
    sortExpiry: "Par expiration", sortName: "Par nom", all: "Tout", new: "+ Nouveau",
    errorName: "Nom requis", errorDate: "Date invalide", errorPao: "Mois invalides",
    limitReached: "Débloquer produits illimités",
    deleteTitle: "Supprimer", deleteMsg: "Vraiment supprimer ?",
    cancel: "Annuler", delete: "Supprimer", openedOn: "Ouvert le", shelfLife: "Durée de vie", expiryDate: "Date d'expiration",
    remind_0: "Le jour même", remind_1: "1 jour avant", remind_3: "3 jours avant", remind_7: "1 semaine", remind_14: "2 semaines", remind_30: "1 mois",
    notificationTitle: "Produit expire !", notificationBody: "{{name}} expire bientôt !",
    welcomeTitle: "Bienvenue sur BeautyExpiry", welcomeText: "Gérez vos cosmétiques et évitez le gaspillage.", startBtn: "Commencer",
    onboard1: "Suivre et organiser", onboard2: "Recevoir des rappels", onboard3: "Routine toujours fraîche"
};

// 5. Italienisch (Italiano)
const it = {
    ...enTranslations,
    dashboard: "Dashboard", add: "Aggiungi", settings: "Impostazioni", searchPlaceholder: "Cerca prodotti...",
    emptyStateText: "Nessun prodotto trovato.", emptyStateSub: "Premi + per aggiungere.",
    fresh: "Fresco", expiringSoon: "Scade presto", expired: "Scaduto",
    daysLeft: "{{days}} giorni rimasti", expiredDaysAgo: "Scaduto da {{days}} giorni", expiresOn: "Scade: {{date}}",
    newProduct: "Nuovo Prodotto", editProduct: "Modifica", nameLabel: "Nome prodotto *", brandLabel: "Marca",
    categoryLabel: "Categoria *", openedLabel: "Data apertura (GG.MM.AAAA) *", paoLabel: "Durata (Mesi) *",
    notesLabel: "Note", remindersLabel: "Promemoria", save: "Salva", camera: "Fotocamera", gallery: "Galleria",
    removeImage: "Rimuovi immagine", custom: "Pers.", appearance: "ASPETTO", language: "Lingua", theme: "Tema",
    premiumContent: "CONTENUTO (PREMIUM)", manageCategories: "Gestisci Categorie", exportData: "Export & Backup",
    exportCSV: "Esporta CSV", exportPDF: "Esporta PDF",
    otherOptions: "ALTRE OPZIONI", deleteExpired: "Rimuovi scaduti", deleteAll: "Rimuovi tutto",
    privacy: "Privacy", terms: "Termini",
    premiumActive: "✅ Premium Attivo", unlockPremium: "Sblocca Premium", restorePurchase: "Ripristina Acquisti",
    premiumTitle: "Sblocca Premium", upgradeBtn: "Upgrade a 3,99 €",
    cat_makeup: "Trucco", cat_skincare: "Cura pelle", cat_haircare: "Capelli", cat_perfume: "Profumo",
    sortExpiry: "Per scadenza", sortName: "Per nome", all: "Tutti", new: "+ Nuovo",
    errorName: "Nome richiesto", errorDate: "Data non valida", errorPao: "Mesi non validi",
    limitReached: "Sblocca prodotti illimitati",
    deleteTitle: "Elimina", deleteMsg: "Eliminare davvero?",
    cancel: "Annulla", delete: "Elimina", openedOn: "Aperto il", shelfLife: "Durata", expiryDate: "Data scadenza",
    remind_0: "Il giorno stesso", remind_1: "1 giorno prima", remind_3: "3 giorni prima", remind_7: "1 settimana", remind_14: "2 settimane", remind_30: "1 mese",
    notificationTitle: "Prodotto in scadenza!", notificationBody: "{{name}} scade presto!",
    welcomeTitle: "Benvenuto in BeautyExpiry", welcomeText: "Gestisci i tuoi cosmetici ed evita sprechi.", startBtn: "Inizia",
    onboard1: "Traccia e organizza", onboard2: "Ricevi promemoria", onboard3: "Routine sempre fresca"
};

// 6. Portugiesisch (Português)
const pt = {
    ...enTranslations,
    dashboard: "Painel", add: "Adic.", settings: "Configurações", searchPlaceholder: "Buscar produtos...",
    emptyStateText: "Nenhum produto encontrado.", emptyStateSub: "Toque em + para adicionar.",
    fresh: "Fresco", expiringSoon: "Vence em breve", expired: "Vencido",
    daysLeft: "Restam {{days}} dias", expiredDaysAgo: "Venceu há {{days}} dias", expiresOn: "Vence: {{date}}",
    newProduct: "Novo Produto", editProduct: "Editar", nameLabel: "Nome do Produto *", brandLabel: "Marca",
    categoryLabel: "Categoria *", openedLabel: "Data Abertura (DD.MM.AAAA) *", paoLabel: "Validade (Meses) *",
    notesLabel: "Notas", remindersLabel: "Lembretes", save: "Salvar", camera: "Câmera", gallery: "Galeria",
    removeImage: "Remover imagem", custom: "Pers.", appearance: "APARÊNCIA", language: "Idioma", theme: "Tema",
    premiumContent: "CONTEÚDO (PREMIUM)", manageCategories: "Gerenciar Categorias", exportData: "Exportar e Backup",
    exportCSV: "Exportar como CSV", exportPDF: "Exportar como PDF",
    otherOptions: "OUTRAS OPÇÕES", deleteExpired: "Apagar vencidos", deleteAll: "Apagar tudo",
    privacy: "Privacidade", terms: "Termos",
    premiumActive: "✅ Premium Ativo", unlockPremium: "Desbloquear Premium", restorePurchase: "Restaurar Compras",
    premiumTitle: "Desbloquear Premium", upgradeBtn: "Melhorar por 3,99 €",
    cat_makeup: "Maquiagem", cat_skincare: "Pele", cat_haircare: "Cabelo", cat_perfume: "Perfume",
    sortExpiry: "Por validade", sortName: "Por nome", all: "Todos", new: "+ Novo",
    errorName: "Nome obrigatório", errorDate: "Data inválida", errorPao: "Meses inválidos",
    limitReached: "Desbloquear produtos ilimitados",
    deleteTitle: "Excluir", deleteMsg: "Excluir mesmo?",
    cancel: "Cancelar", delete: "Excluir", openedOn: "Aberto em", shelfLife: "Vida útil", expiryDate: "Data de validade",
    remind_0: "No dia", remind_1: "1 dia antes", remind_3: "3 dias antes", remind_7: "1 semana", remind_14: "2 semanas", remind_30: "1 mês",
    notificationTitle: "Produto vencendo!", notificationBody: "{{name}} vence em breve!",
    welcomeTitle: "Bem-vindo ao BeautyExpiry", welcomeText: "Gerencie seus cosméticos e evite desperdícios.", startBtn: "Começar",
    onboard1: "Rastrear e organizar", onboard2: "Receber lembretes", onboard3: "Rotina sempre fresca"
};

// 7. Türkisch (Türkçe)
const tr = {
    ...enTranslations,
    dashboard: "Panel", add: "Ekle", settings: "Ayarlar", searchPlaceholder: "Ürün ara...",
    emptyStateText: "Ürün bulunamadı.", emptyStateSub: "Eklemek için + 'ya basın.",
    fresh: "Taze", expiringSoon: "Yakında bitiyor", expired: "Süresi doldu",
    daysLeft: "{{days}} gün kaldı", expiredDaysAgo: "{{days}} gün önce bitti", expiresOn: "Bitiş: {{date}}",
    newProduct: "Yeni Ürün", editProduct: "Düzenle", nameLabel: "Ürün Adı *", brandLabel: "Marka",
    categoryLabel: "Kategori *", openedLabel: "Açılış Tarihi (GG.AA.YYYY) *", paoLabel: "Ömür (Ay) *",
    notesLabel: "Notlar", remindersLabel: "Hatırlatıcılar", save: "Kaydet", camera: "Kamera", gallery: "Galeri",
    removeImage: "Resmi kaldır", custom: "Özel", appearance: "GÖRÜNÜM", language: "Dil", theme: "Tema",
    premiumContent: "İÇERİK (PREMIUM)", manageCategories: "Kategorileri Yönet", exportData: "Dışa Aktar & Yedekle",
    exportCSV: "CSV olarak aktar", exportPDF: "PDF olarak aktar",
    otherOptions: "DİĞER SEÇENEKLER", deleteExpired: "Süresi dolanları sil", deleteAll: "Tümünü sil",
    privacy: "Gizlilik", terms: "Şartlar",
    premiumActive: "✅ Premium Aktif", unlockPremium: "Premium Kilidini Aç", restorePurchase: "Satın Alımları Geri Yükle",
    premiumTitle: "Premium Kilidini Aç", upgradeBtn: "3,99 € ile Yükselt",
    cat_makeup: "Makyaj", cat_skincare: "Cilt Bakımı", cat_haircare: "Saç Bakımı", cat_perfume: "Parfüm",
    sortExpiry: "Tarihe göre", sortName: "İsme göre", all: "Tümü", new: "+ Yeni",
    errorName: "İsim gerekli", errorDate: "Geçersiz tarih", errorPao: "Geçersiz ay",
    limitReached: "Sınırsız ürün kilidini aç",
    deleteTitle: "Sil", deleteMsg: "Gerçekten silinsin mi?",
    cancel: "İptal", delete: "Sil", openedOn: "Açılış", shelfLife: "Raf Ömrü", expiryDate: "Son Kullanma",
    remind_0: "Bitiş gününde", remind_1: "1 gün önce", remind_3: "3 gün önce", remind_7: "1 hafta", remind_14: "2 hafta", remind_30: "1 ay",
    notificationTitle: "Ürün süresi doluyor!", notificationBody: "{{name}} yakında bitiyor!",
    welcomeTitle: "BeautyExpiry'ye Hoş Geldiniz", welcomeText: "Kozmetik ürünlerinizi yönetin, tarihleri takip edin ve israfı önleyin.", startBtn: "Başla",
    onboard1: "Takip et ve düzenle", onboard2: "Hatırlatıcı al", onboard3: "Rutinini taze tut"
};

const TRANSLATIONS: any = { de: deTranslations, en: enTranslations, es, fr, it, pt, tr };

type Language = keyof typeof TRANSLATIONS;
const AVAILABLE_LANGUAGES: {code: Language, label: string, flag: string}[] = [
    {code: 'en', label: 'English', flag: '🇬🇧'},
    {code: 'de', label: 'Deutsch', flag: '🇩🇪'},
    {code: 'es', label: 'Español', flag: '🇪🇸'},
    {code: 'fr', label: 'Français', flag: '🇫🇷'},
    {code: 'it', label: 'Italiano', flag: '🇮🇹'},
    {code: 'pt', label: 'Português', flag: '🇧🇷'},
    {code: 'tr', label: 'Türkçe', flag: '🇹🇷'}
];

const STANDARD_CATEGORIES_KEYS = ['cat_makeup', 'cat_skincare', 'cat_haircare', 'cat_perfume'];

// --- HELPERS ---
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};
const parseDateToISO = (displayDate: string) => {
    const parts = displayDate.split('.');
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
const calculateExpiryDateISO = (openedISO: string, pao: number) => {
  const date = new Date(openedISO);
  date.setMonth(date.getMonth() + pao);
  return date.toISOString().split('T')[0];
};
const getDaysLeft = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- COMPONENTS ---

const OnboardingScreen = ({ onStart, onChangeLang, currentLang, t, theme, insets }: any) => {
    return (
        <View style={[styles.container, {backgroundColor: theme.colors.bg, justifyContent: 'center', padding: 30, paddingBottom: Math.max(insets.bottom, 20) + 20}]}>
            <View style={{alignItems: 'center', marginBottom: 30, marginTop: 40}}>
                <View style={{width: 80, height: 80, borderRadius: 20, backgroundColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 20}}>
                    <Sparkles size={40} color="white" />
                </View>
                <Text style={{fontSize: 28, fontWeight: 'bold', color: theme.colors.text, textAlign: 'center', marginBottom: 10}}>{t.welcomeTitle}</Text>
                <Text style={{fontSize: 16, color: theme.colors.subText, textAlign: 'center', lineHeight: 24}}>{t.welcomeText}</Text>
            </View>
            <View style={{marginBottom: 30}}>
                <View style={styles.featureRow}><CheckCircle size={20} color={theme.colors.fresh} style={{marginRight: 10}} /><Text style={{fontSize: 16, color: theme.colors.text}}>{t.onboard1}</Text></View>
                <View style={styles.featureRow}><CheckCircle size={20} color={theme.colors.fresh} style={{marginRight: 10}} /><Text style={{fontSize: 16, color: theme.colors.text}}>{t.onboard2}</Text></View>
                <View style={styles.featureRow}><CheckCircle size={20} color={theme.colors.fresh} style={{marginRight: 10}} /><Text style={{fontSize: 16, color: theme.colors.text}}>{t.onboard3}</Text></View>
            </View>
            <Text style={{textAlign: 'center', color: theme.colors.subText, marginBottom: 15}}>{t.language}</Text>
            <View style={{height: 100, marginBottom: 20}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12, paddingHorizontal: 5}}>
                    {AVAILABLE_LANGUAGES.map(l => (
                        <TouchableOpacity key={String(l.code)} style={[styles.chip, {backgroundColor: theme.colors.card, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', paddingHorizontal: 5}, currentLang === l.code && {backgroundColor: theme.colors.text}]} onPress={() => onChangeLang(l.code)}>
                            <Text style={[styles.chipText, {color: theme.colors.text, marginBottom: 5, fontSize: 12}, currentLang === l.code && {color: theme.colors.bg}]}>{l.label}</Text>
                            <Text style={{fontSize: 24}}>{l.flag}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <TouchableOpacity style={[styles.buyButton, {backgroundColor: theme.colors.text, width: '100%'}]} onPress={onStart}>
                <Text style={[styles.buyButtonText, {color: theme.colors.bg}]}>{t.startBtn}</Text>
                <ArrowRight size={20} color={theme.colors.bg} style={{marginLeft: 10}} />
            </TouchableOpacity>
        </View>
    );
};
type ProductPressHandler = (id: string) => void;

interface DashboardProps {
  products: Product[];
  onProductPress: ProductPressHandler;
  customCategories: string[];
  lang: string;
  t: any;
  theme: any;
}

const Dashboard = ({ products, onProductPress, customCategories, lang, t, theme }: any) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'expiry' | 'name'>('expiry');
  
  const stdCatsTranslated = STANDARD_CATEGORIES_KEYS.map(key => ({ key, label: t[key] || t.en?.[key] || key }));
  
  const allCategories = [...stdCatsTranslated.map(c => c.label), ...customCategories];
  let filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (activeCategory) filtered = filtered.filter((p: any) => {
      const pLabel = STANDARD_CATEGORIES_KEYS.includes(p.category) ? (t[p.category] || t.en?.[p.category] || p.category) : p.category;
      return pLabel === activeCategory || p.category === activeCategory;
  });
  filtered.sort((a: any, b: any) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.bg}]}>
      <View style={styles.header}>
        <View style={[styles.searchBar, {backgroundColor: theme.colors.card}]}>
          <Search size={20} color={theme.colors.subText} />
          <TextInput placeholder={t.searchPlaceholder} placeholderTextColor={theme.colors.subText} style={[styles.searchInput, {color: theme.colors.text}]} value={search} onChangeText={setSearch} />
        </View>
        <View style={{marginTop: 15, flexDirection: 'row', alignItems: 'center'}}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingRight: 20}}>
                <TouchableOpacity style={[styles.filterChip, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]} onPress={() => setSortBy(prev => prev === 'expiry' ? 'name' : 'expiry')}>
                    <ArrowUpDown size={14} color={theme.colors.text} style={{marginRight: 5}}/>
                    <Text style={{fontSize: 12, fontWeight: 'bold', color: theme.colors.text}}>{sortBy === 'expiry' ? t.sortExpiry : t.sortName}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterChip, activeCategory === null ? {backgroundColor: theme.colors.text} : {borderColor: theme.colors.border}]} onPress={() => setActiveCategory(null)}>
                    <Text style={[styles.filterChipText, {color: activeCategory === null ? theme.colors.bg : theme.colors.subText}]}>{t.all}</Text>
                </TouchableOpacity>
                {allCategories.map(cat => (
                    <TouchableOpacity key={String(cat)} style={[styles.filterChip, activeCategory === cat ? {backgroundColor: theme.colors.text} : {borderColor: theme.colors.border}]} onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}>
                        <Text style={[styles.filterChipText, {color: activeCategory === cat ? theme.colors.bg : theme.colors.subText}]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
             </ScrollView>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}><Text style={{color: theme.colors.subText}}>{t.emptyStateText}</Text><Text style={{color: theme.colors.subText}}>{t.emptyStateSub}</Text></View>
        ) : (
          filtered.map((product: any) => {
            const days = getDaysLeft(product.expiryDate);
            let statusColor = theme.colors.fresh; let statusText = t.fresh;
            if (days < 0) { statusColor = theme.colors.expired; statusText = t.expired; }
            else if (days <= 14) { statusColor = theme.colors.warning; statusText = t.expiringSoon; }
            const daysText = days < 0 ? t.expiredDaysAgo.replace('{{days}}', Math.abs(days)) : t.daysLeft.replace('{{days}}', days);
            return (
              <TouchableOpacity key={String(product.id)} onPress={() => onProductPress(product.id)} activeOpacity={0.9}>
                <View style={[styles.card, {backgroundColor: theme.colors.card}]}>
                  <View style={{flexDirection: 'row', gap: 15}}>
                    {product.imageUri ? (<Image source={{ uri: product.imageUri }} style={styles.productImage} />) : (<View style={styles.productImagePlaceholder}><Text style={{fontSize: 32}}>🧴</Text></View>)}
                    <View style={{flex: 1, justifyContent: 'center'}}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <View style={{flex: 1, marginRight: 8}}><Text style={[styles.productName, {color: theme.colors.text}]} numberOfLines={2}>{product.name}</Text><Text style={[styles.brandText, {color: theme.colors.subText}]}>{product.brand}</Text></View>
                        <View style={[styles.badge, {backgroundColor: statusColor}]}><Text style={styles.badgeText}>{statusText}</Text></View>
                      </View>
                      <View style={{marginTop: 8}}><Text style={{fontWeight: 'bold', color: statusColor, fontSize: 14}}>{daysText}</Text><Text style={[styles.dateText, {color: theme.colors.subText}]}>{t.expiresOn.replace('{{date}}', formatDate(product.expiryDate))}</Text></View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const ManageCategoriesScreen = ({ customCategories, onAddCategory, onDeleteCategory, onBack, t, theme }: any) => {
    const [newCat, setNewCat] = useState('');
    const handleAdd = () => {
        if (!newCat.trim()) return;
        const stdLabels = STANDARD_CATEGORIES_KEYS.map(k => t[k]);
        if (stdLabels.includes(newCat) || customCategories.includes(newCat)) { Alert.alert(t.errorName, t.catExists); return; }
        onAddCategory(newCat); setNewCat('');
    }
    return (
        <View style={[styles.container, {backgroundColor: theme.colors.bg}]}>
            <View style={styles.header}><TouchableOpacity onPress={onBack} style={{marginRight: 10}}><ArrowLeft size={24} color={theme.colors.text}/></TouchableOpacity><Text style={[styles.headerTitle, {color: theme.colors.text}]}>{t.manageCategories}</Text></View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.label, {color: theme.colors.text}]}>{t.newProduct}</Text> 
                <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
                    <TextInput style={[styles.input, {flex: 1, marginBottom: 0, backgroundColor: theme.colors.card, color: theme.colors.text}]} placeholder={t.newCatPlaceholder} placeholderTextColor={theme.colors.subText} value={newCat} onChangeText={setNewCat}/>
                    <TouchableOpacity style={[styles.saveButton, {marginTop: 0, paddingHorizontal: 20, justifyContent: 'center', backgroundColor: theme.colors.text}]} onPress={handleAdd}><Plus size={24} color={theme.colors.bg}/></TouchableOpacity>
                </View>
                <Text style={[styles.sectionHeader, {color: theme.colors.subText}]}>{t.myCategories}</Text>
                {customCategories.length === 0 ? (<Text style={{color: theme.colors.subText, fontStyle: 'italic', marginBottom: 20}}>{t.noCustomCats}</Text>) : (customCategories.map((cat: string, idx: number) => (<View key={String(idx)} style={[styles.categoryRow, {backgroundColor: theme.colors.card}]}><Text style={{fontSize: 16, color: theme.colors.text}}>{cat}</Text><TouchableOpacity onPress={() => onDeleteCategory(cat)}><Trash2 size={20} color={theme.colors.expired} /></TouchableOpacity></View>)))}
                <Text style={[styles.sectionHeader, {color: theme.colors.subText}]}>{t.stdCategories}</Text>
                {STANDARD_CATEGORIES_KEYS.map((key, idx) => (<View key={String(idx)} style={[styles.categoryRow, {backgroundColor: theme.colors.card, opacity: 0.6}]}><Text style={{fontSize: 16, color: theme.colors.text}}>{t[key]}</Text><Lock size={16} color={theme.colors.subText} /></View>))}
            </ScrollView>
        </View>
    );
}

const ProductForm = ({ mode, initialProduct, onSave, onCancel, isPremium, onTriggerPremium, customCategories, onManageCategories, t, theme }: any) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [brand, setBrand] = useState(initialProduct?.brand || '');
  const [pao, setPao] = useState(initialProduct?.pao || 6);
  const [customPao, setCustomPao] = useState('');
  const [category, setCategory] = useState(initialProduct?.category || STANDARD_CATEGORIES_KEYS[1]); 
  const [image, setImage] = useState<string | null>(initialProduct?.imageUri || null);
  const [notes, setNotes] = useState(initialProduct?.notes || '');
  const [offsets, setOffsets] = useState<number[]>(initialProduct?.notificationOffsets || [0]);
  const [openedDateDisplay, setOpenedDateDisplay] = useState(initialProduct?.openedDate ? formatDate(initialProduct.openedDate) : formatDate(new Date().toISOString().split('T')[0]));

  useEffect(() => { if (initialProduct?.pao && ![3, 6, 12, 24].includes(initialProduct.pao)) { setCustomPao(initialProduct.pao.toString()); setPao(-1); } }, []);
  const toggleOffset = (offset: number) => {
    if (offsets.includes(offset)) { setOffsets(offsets.filter(o => o !== offset)); } 
    else { if (!isPremium && offsets.length >= 1) { onTriggerPremium(t.unlockNotifications); return; } setOffsets([...offsets, offset]); }
  };
  const takePhoto = async () => { const { granted } = await ImagePicker.requestCameraPermissionsAsync(); if (!granted) { alert("Kamera benötigt!"); return; } const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 }); if (!result.canceled) setImage(result.assets[0].uri); };
  const pickImage = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 }); if (!result.canceled) setImage(result.assets[0].uri); };
  const handleSave = () => {
    if (!name) return Alert.alert(t.errorName);
    const isoDate = parseDateToISO(openedDateDisplay);
    if (!isoDate) return Alert.alert(t.errorDate);
    let finalPao = pao;
    if (pao === -1) { const customVal = parseInt(customPao); if (isNaN(customVal) || customVal <= 0) return Alert.alert(t.errorPao); finalPao = customVal; }
    const expiry = calculateExpiryDateISO(isoDate, finalPao);
    onSave({ id: initialProduct?.id || Date.now().toString(), name, brand, category, pao: finalPao, openedDate: isoDate, expiryDate: expiry, imageUri: image, notes, notificationOffsets: offsets });
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.bg}]}>
      <View style={styles.header}><TouchableOpacity onPress={onCancel} style={{marginRight: 10}}><ArrowLeft size={24} color={theme.colors.text}/></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {image ? (<View style={{alignItems: 'center', marginBottom: 20}}><Image source={{ uri: image }} style={{width: 150, height: 150, borderRadius: 20}} /><TouchableOpacity onPress={() => setImage(null)} style={{marginTop: 10}}><Text style={{color: 'red'}}>{t.removeImage}</Text></TouchableOpacity></View>) : (<View style={{flexDirection: 'row', gap: 15, marginBottom: 20}}><TouchableOpacity style={styles.imageBtn} onPress={pickImage}><ImageIcon size={24} color={theme.colors.subText} /><Text style={{color: theme.colors.subText, fontSize: 12}}>{t.gallery}</Text></TouchableOpacity><TouchableOpacity style={styles.imageBtn} onPress={takePhoto}><Camera size={24} color={theme.colors.subText} /><Text style={{color: theme.colors.subText, fontSize: 12}}>{t.camera}</Text></TouchableOpacity></View>)}
        </View>
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.nameLabel}</Text><TextInput style={[styles.input, {backgroundColor: theme.colors.card, color: theme.colors.text}]} placeholder={t.nameLabel} placeholderTextColor={theme.colors.subText} value={name} onChangeText={setName} />
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.brandLabel}</Text><TextInput style={[styles.input, {backgroundColor: theme.colors.card, color: theme.colors.text}]} placeholder={t.brandLabel} placeholderTextColor={theme.colors.subText} value={brand} onChangeText={setBrand} />
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.categoryLabel}</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10}}>
         {STANDARD_CATEGORIES_KEYS.map(key => (
  <TouchableOpacity
    key={String(key)} // <- FIX: sicheres string-key
    style={[styles.chip, {backgroundColor: theme.colors.card}, category === key && {backgroundColor: theme.colors.text}]}
    onPress={() => setCategory(key as string)} // <- FIX: typensichere Übergabe
  >
    <Text style={[styles.chipText, {color: theme.colors.text}, category === key && {color: theme.colors.bg}]}>{t[key as keyof typeof t]}</Text>
  </TouchableOpacity>
))}
   
            {customCategories.map((cat: string) => (<TouchableOpacity key={String(cat)} style={[styles.chip, {backgroundColor: theme.colors.card}, category === cat && {backgroundColor: theme.colors.text}]} onPress={() => setCategory(cat)}><Text style={[styles.chipText, {color: theme.colors.text}, category === cat && {color: theme.colors.bg}]}>{cat}</Text></TouchableOpacity>))}
            <TouchableOpacity style={[styles.chip, {backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.gold}]} onPress={() => isPremium ? onManageCategories() : onTriggerPremium(t.premiumFeature)}><Text style={[styles.chipText, {color: theme.colors.gold, fontWeight: 'bold'}]}>{t.new}</Text></TouchableOpacity>
        </View>
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.openedLabel}</Text><TextInput style={[styles.input, {backgroundColor: theme.colors.card, color: theme.colors.text}]} placeholder="TT.MM.JJJJ" placeholderTextColor={theme.colors.subText} value={openedDateDisplay} onChangeText={setOpenedDateDisplay} keyboardType="numbers-and-punctuation"/>
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.paoLabel}</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10}}>
          {[3, 6, 12, 24].map(m => (<TouchableOpacity key={String(m)} style={[styles.chip, {backgroundColor: theme.colors.card}, pao === m && {backgroundColor: theme.colors.text}]} onPress={() => setPao(m)}><Text style={[styles.chipText, {color: theme.colors.text}, pao === m && {color: theme.colors.bg}]}>{m}M</Text></TouchableOpacity>))}
          <TouchableOpacity style={[styles.chip, {backgroundColor: theme.colors.card}, pao === -1 && {backgroundColor: theme.colors.text}]} onPress={() => setPao(-1)}><Text style={[styles.chipText, {color: theme.colors.text}, pao === -1 && {color: theme.colors.bg}]}>{t.custom}</Text></TouchableOpacity>
        </View>
        {pao === -1 && (<View style={{marginBottom: 20}}><TextInput style={[styles.input, {backgroundColor: theme.colors.card, color: theme.colors.text}]} keyboardType="numeric" placeholder="18" placeholderTextColor={theme.colors.subText} value={customPao} onChangeText={setCustomPao} /></View>)}
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.notesLabel}</Text><TextInput style={[styles.input, {backgroundColor: theme.colors.card, color: theme.colors.text, height: 100, textAlignVertical: 'top'}]} placeholder={t.notesLabel} placeholderTextColor={theme.colors.subText} multiline numberOfLines={4} value={notes} onChangeText={setNotes} />
        <Text style={[styles.label, {color: theme.colors.text}]}>{t.remindersLabel}</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20}}>
            {[ { l: t.remind_0, val: 0 }, { l: t.remind_1, val: 1 }, { l: t.remind_3, val: 3 }, { l: t.remind_7, val: 7 }, { l: t.remind_14, val: 14 }, { l: t.remind_30, val: 30 } ].map((opt) => {
                const isSelected = offsets.includes(opt.val);
                return (<TouchableOpacity key={String(opt.val)} style={[styles.chip, {backgroundColor: theme.colors.card}, isSelected && {backgroundColor: theme.colors.gold}]} onPress={() => toggleOffset(opt.val)}><Text style={[styles.chipText, {color: theme.colors.text}, isSelected && {color: 'white'}]}>{opt.l}</Text></TouchableOpacity>)
            })}
        </View>
        <TouchableOpacity style={[styles.saveButton, {backgroundColor: theme.colors.text}]} onPress={handleSave}><Text style={[styles.saveButtonText, {color: theme.colors.bg}]}>{t.save}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ProductDetails = ({ product, onBack, onEdit, onDelete, onDuplicate, t, theme }: any) => {
    const days = getDaysLeft(product.expiryDate);
    let statusColor = theme.colors.fresh; let statusText = t.fresh;
    if (days < 0) { statusColor = theme.colors.expired; statusText = t.expired; }
    else if (days <= 14) { statusColor = theme.colors.warning; statusText = t.expiringSoon; }
    const displayCategory = STANDARD_CATEGORIES_KEYS.includes(product.category) ? (t[product.category] || t.en?.[product.category]) : product.category;
    const activeReminders = product.notificationOffsets.map((offset: number) => {
        if(offset===0) return t.remind_0; if(offset===1) return t.remind_1; if(offset===3) return t.remind_3;
        if(offset===7) return t.remind_7; if(offset===14) return t.remind_14; if(offset===30) return t.remind_30;
        return "";
    }).filter((s: string) => s !== "").join(", ");
    return (
        <View style={[styles.container, {backgroundColor: theme.colors.bg}]}>
            <View style={[styles.header, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}><TouchableOpacity onPress={onBack} style={{padding: 5}}><ArrowLeft size={24} color={theme.colors.text} /></TouchableOpacity><View style={{flexDirection: 'row', gap: 15}}><TouchableOpacity onPress={onDuplicate} style={{padding: 5}}><Copy size={24} color={theme.colors.text} /></TouchableOpacity><TouchableOpacity onPress={onEdit} style={{padding: 5}}><Edit2 size={24} color={theme.colors.text} /></TouchableOpacity><TouchableOpacity onPress={() => { Alert.alert(t.deleteTitle, t.deleteMsg, [ { text: t.cancel }, { text: t.delete, style: 'destructive', onPress: onDelete } ]) }} style={{padding: 5}}><Trash2 size={24} color={theme.colors.expired} /></TouchableOpacity></View></View>
            <ScrollView contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
                <View style={{alignItems: 'center', marginVertical: 20}}>{product.imageUri ? (<Image source={{ uri: product.imageUri }} style={{width: 250, height: 250, borderRadius: 24}} />) : (<View style={{width: 200, height: 200, borderRadius: 24, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center'}}><Text style={{fontSize: 60}}>🧴</Text></View>)}</View>
                <View style={{alignItems: 'center', marginBottom: 20}}><Text style={{fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: theme.colors.text}}>{product.name}</Text><Text style={{fontSize: 18, color: theme.colors.subText}}>{product.brand}</Text><View style={[styles.badge, {backgroundColor: statusColor, marginTop: 10, paddingHorizontal: 15, paddingVertical: 6}]}><Text style={[styles.badgeText, {fontSize: 12}]}>{statusText}</Text></View></View>
                <View style={[styles.card, {backgroundColor: theme.colors.card}]}>
                    <View style={styles.detailRow}><View style={{flexDirection: 'row', alignItems: 'center'}}><Calendar size={20} color={theme.colors.gold} style={{marginRight: 10}}/><Text style={{fontSize: 16, color: theme.colors.text}}>{t.openedOn}</Text></View><Text style={{fontSize: 16, fontWeight: 'bold', color: theme.colors.text}}>{formatDate(product.openedDate)}</Text></View><View style={[styles.divider, {backgroundColor: theme.colors.border}]} />
                    <View style={styles.detailRow}><View style={{flexDirection: 'row', alignItems: 'center'}}><Folder size={20} color={theme.colors.gold} style={{marginRight: 10}}/><Text style={{fontSize: 16, color: theme.colors.text}}>{t.categoryLabel.replace('*','')}</Text></View><Text style={{fontSize: 16, fontWeight: 'bold', color: theme.colors.text}}>{displayCategory}</Text></View><View style={[styles.divider, {backgroundColor: theme.colors.border}]} />
                    <View style={styles.detailRow}><View style={{flexDirection: 'row', alignItems: 'center'}}><Folder size={20} color={theme.colors.gold} style={{marginRight: 10}}/><Text style={{fontSize: 16, color: theme.colors.text}}>{t.shelfLife}</Text></View><Text style={{fontSize: 16, fontWeight: 'bold', color: theme.colors.text}}>{product.pao} M</Text></View><View style={[styles.divider, {backgroundColor: theme.colors.border}]} />
                    <View style={styles.detailRow}><View style={{flexDirection: 'row', alignItems: 'center'}}><Bell size={20} color={theme.colors.gold} style={{marginRight: 10}}/><Text style={{fontSize: 16, color: theme.colors.text}}>{t.expiryDate}</Text></View><Text style={{fontSize: 16, fontWeight: 'bold', color: statusColor}}>{formatDate(product.expiryDate)}</Text></View>
                </View>
                <View style={[styles.card, {marginTop: 20, backgroundColor: theme.colors.card}]}><View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}><Bell size={20} color={theme.colors.gold} style={{marginRight: 10}}/><Text style={{fontWeight: 'bold', color: theme.colors.subText}}>{t.remindersLabel.toUpperCase()}</Text></View><Text style={{fontSize: 16, color: theme.colors.text}}>{activeReminders || "-"}</Text></View>
                {product.notes ? (<View style={[styles.card, {marginTop: 20, backgroundColor: theme.colors.card}]}><Text style={{fontWeight: 'bold', marginBottom: 10, color: theme.colors.subText}}>{t.notesTitle}</Text><Text style={{fontSize: 16, lineHeight: 24, color: theme.colors.text}}>{product.notes}</Text></View>) : null}
            </ScrollView>
        </View>
    )
}

const SettingsScreen = ({ isPremium, onPremiumPress, onResetPremium, onManageCategories, onChangeLang, currentLang, t, theme, onSetTheme, currentTheme, onExportCSV, onExportPDF, onDeleteExpired, onDeleteAll, onShowLegal, onRestorePurchase }: any) => {
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [debugCount, setDebugCount] = useState(0);
  const handleDebugTap = () => { const newCount = debugCount + 1; setDebugCount(newCount); if (newCount >= 5) { onResetPremium(); setDebugCount(0); } }

  return (
      <View style={[styles.container, {backgroundColor: theme.colors.bg}]}>
        <View style={styles.header}><Text style={[styles.headerTitle, {color: theme.colors.text}]}>{t.settings}</Text></View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>{t.appearance}</Text>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card}]} onPress={() => setLangModalVisible(true)}><View style={styles.settingLeft}><Globe size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.language}</Text></View><View style={styles.settingRight}><Text style={{color: theme.colors.subText}}>{AVAILABLE_LANGUAGES.find(l => l.code === currentLang)?.label}</Text><ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card}]} onPress={() => setThemeModalVisible(true)}><View style={styles.settingLeft}><Palette size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.theme}</Text></View><View style={styles.settingRight}><Text style={{color: theme.colors.subText}}>{THEMES[currentTheme as ThemeKey].label}</Text><ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>

          <Text style={styles.sectionHeader}>{t.premiumContent}</Text>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card, opacity: isPremium ? 1 : 0.6}]} onPress={() => { if (isPremium) onManageCategories(); else onPremiumPress(t.premiumFeature); }}><View style={styles.settingLeft}><Folder size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.manageCategories}</Text></View><View style={styles.settingRight}>{!isPremium && <Lock size={14} color={theme.colors.warning} style={{marginRight: 5}}/>}<ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card, opacity: isPremium ? 1 : 0.6}]} onPress={() => { if (isPremium) onExportCSV(); else onPremiumPress(t.premiumFeature); }}><View style={styles.settingLeft}><FileText size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.exportCSV}</Text></View><View style={styles.settingRight}>{!isPremium && <Lock size={14} color={theme.colors.warning} style={{marginRight: 5}}/>}<ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card, opacity: isPremium ? 1 : 0.6}]} onPress={() => { if (isPremium) onExportPDF(); else onPremiumPress(t.premiumFeature); }}><View style={styles.settingLeft}><Download size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.exportPDF}</Text></View><View style={styles.settingRight}>{!isPremium && <Lock size={14} color={theme.colors.warning} style={{marginRight: 5}}/>}<ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>

          <Text style={styles.sectionHeader}>{t.otherOptions}</Text>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card}]} onPress={onRestorePurchase}><View style={styles.settingLeft}><RefreshCcw size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.restorePurchase}</Text></View><View style={styles.settingRight}><ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card}]} onPress={onDeleteExpired}><View style={styles.settingLeft}><Trash2 size={20} color={theme.colors.text}/><Text style={[styles.settingText, {color: theme.colors.text}]}>{t.deleteExpired}</Text></View><View style={styles.settingRight}><ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, {backgroundColor: theme.colors.card}]} onPress={onDeleteAll}><View style={styles.settingLeft}><Trash2 size={20} color={theme.colors.expired}/><Text style={[styles.settingText, {color: theme.colors.expired}]}>{t.deleteAll}</Text></View><View style={styles.settingRight}><ChevronRight size={16} color={theme.colors.subText}/></View></TouchableOpacity>
          
          <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 10}}>
            <TouchableOpacity style={{padding: 10}} onPress={() => onShowLegal('privacy')}><Text style={{color: theme.colors.subText, fontSize: 12, textDecorationLine: 'underline'}}>{t.privacy}</Text></TouchableOpacity>
            <TouchableOpacity style={{padding: 10}} onPress={() => onShowLegal('terms')}><Text style={{color: theme.colors.subText, fontSize: 12, textDecorationLine: 'underline'}}>{t.terms}</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.premiumBanner, isPremium && {backgroundColor: theme.colors.fresh}]} onPress={() => !isPremium && onPremiumPress(t.premiumTitle)}>
              {isPremium ? (<Text style={{color: 'white', fontWeight: 'bold'}}>{t.premiumActive}</Text>) : (<View style={{flexDirection: 'row', alignItems: 'center'}}><Sparkles size={20} color={theme.colors.gold} style={{marginRight: 10}}/><Text style={{color: theme.colors.gold, fontWeight: 'bold'}}>{t.unlockPremium}</Text></View>)}
          </TouchableOpacity>
          <TouchableOpacity style={{marginTop: 40, padding: 20}} onPress={handleDebugTap} activeOpacity={1}><Text style={{fontSize: 12, color: theme.colors.subText, textAlign: 'center'}}>{t.version}</Text></TouchableOpacity>
        </ScrollView>
        <Modal visible={langModalVisible} transparent animationType="slide"><View style={styles.modalOverlay}><View style={[styles.modalContent, {backgroundColor: theme.colors.bg}]}><View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}><Text style={{fontSize: 20, fontWeight: 'bold', color: theme.colors.text}}>{t.language}</Text><TouchableOpacity onPress={() => setLangModalVisible(false)}><X size={24} color={theme.colors.text}/></TouchableOpacity></View></View></View></Modal>
        <Modal visible={themeModalVisible} transparent animationType="slide"><View style={styles.modalOverlay}><View style={[styles.modalContent, {backgroundColor: theme.colors.bg}]}><View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}><Text style={{fontSize: 20, fontWeight: 'bold', color: theme.colors.text}}>{t.theme}</Text><TouchableOpacity onPress={() => setThemeModalVisible(false)}><X size={24} color={theme.colors.text}/></TouchableOpacity></View>{Object.keys(THEMES).map((key) => {
  const themeDef = THEMES[key as ThemeKey];
  const isLocked = themeDef.premium && !isPremium;
  return (
    <TouchableOpacity
      key={String(key)} // <- FIX: sichere string key
      style={[styles.langItem, {borderColor: theme.colors.border}]}
      onPress={() => {
        if (isLocked) {
          setThemeModalVisible(false);
          onPremiumPress(t.premiumFeature);
          return;
        }
        onSetTheme(key as ThemeKey); // <- FIX: typensicherer Aufruf
        setThemeModalVisible(false);
      }}
    >
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: themeDef.colors.bg, borderWidth: 1, borderColor: '#ccc', marginRight: 10}} />
        <Text style={{fontSize: 16, color: theme.colors.text}}>{themeDef.label}</Text>
      </View>
      {isLocked ? <Lock size={16} color={theme.colors.warning} /> : (currentTheme === key && <Check size={20} color={theme.colors.fresh} />)}
    </TouchableOpacity>
  );
})}
</View></View></Modal>
      </View>
  );
}

const LegalModal = ({ visible, onClose, type, lang, t, theme }: any) => {
    // Sicherer Zugriff auf die Rechtstexte
    const textGroup = type === 'privacy' ? LEGAL_TEXTS.privacy : LEGAL_TEXTS.terms;
    // @ts-ignore
    const text = textGroup[lang] || textGroup.en;

    return (<Modal visible={visible} animationType="slide"><SafeAreaProvider><View style={[styles.container, {backgroundColor: theme.colors.bg, padding: 20}]}><View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20, marginTop: 40}}><TouchableOpacity onPress={onClose} style={{padding: 5}}><X size={30} color={theme.colors.text} /></TouchableOpacity></View><ScrollView contentContainerStyle={{paddingBottom: 50}}><Text style={{fontSize: 16, lineHeight: 24, color: theme.colors.text}}>{text}</Text><Text style={{fontSize: 14, color: theme.colors.subText, marginTop: 30, fontStyle: 'italic'}}>{t.legalDisclaimer}</Text></ScrollView></View></SafeAreaProvider></Modal>)
}

const PremiumModal = ({ visible, onClose, onBuy, reason, t, theme }: any) => (
  <Modal visible={visible} animationType="slide" transparent><View style={styles.modalOverlay}><View style={[styles.modalContent, {backgroundColor: theme.colors.bg}]}><TouchableOpacity style={styles.closeModal} onPress={onClose}><X size={24} color={theme.colors.text}/></TouchableOpacity><View style={{alignItems: 'center', marginBottom: 20}}><View style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}><Sparkles size={30} color={theme.colors.gold} fill={theme.colors.gold} /></View><Text style={{fontSize: 16, fontWeight: 'bold', color: theme.colors.gold, marginBottom: 5}}>{reason}</Text><Text style={{fontSize: 22, fontWeight: 'bold', color: theme.colors.text}}>{t.premiumTitle}</Text></View><ScrollView style={{maxHeight: 200, marginBottom: 20}}>{(t.featuresList || []).map((feat: string, i: number) => (<View key={i} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}><Check size={18} color={theme.colors.fresh} style={{marginRight: 10}} /><Text style={{color: theme.colors.text, fontSize: 14}}>{feat}</Text></View>))}</ScrollView><TouchableOpacity style={[styles.buyButton, {backgroundColor: theme.colors.gold}]} onPress={onBuy}><Text style={styles.buyButtonText}>{t.upgradeBtn}</Text></TouchableOpacity></View></View></Modal>
);

const SuccessModal = ({ visible, onClose, t, theme }: any) => (<Modal visible={visible} animationType="fade" transparent><View style={styles.modalOverlay}><View style={[styles.modalContent, {backgroundColor: theme.colors.bg, alignItems: 'center'}]}><View style={{width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}><CheckCircle size={30} color={theme.colors.gold} fill={theme.colors.gold} /></View><Text style={{fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginTop: 10, textAlign: 'center'}}>{t.successTitle}</Text><Text style={{fontSize: 16, color: theme.colors.subText, marginVertical: 20, textAlign: 'center', lineHeight: 24}}>{t.successBody}</Text><TouchableOpacity style={[styles.buyButton, {backgroundColor: theme.colors.fresh, width: '100%'}]} onPress={onClose}><Text style={styles.buyButtonText}>{t.close}</Text></TouchableOpacity></View></View></Modal>);

// --- MAIN ---
function MainApp() {
  const insets = useSafeAreaInsets();
  // FIXED: activeTab als string definiert
  type Tab = 'dashboard' | 'add' | 'settings' | 'details' | 'edit' | 'manageCategories';
const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showPremium, setShowPremium] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [premiumReason, setPremiumReason] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [language, setLanguage] = useState<Language>('en'); 
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('beige');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalType, setLegalType] = useState<'privacy'|'terms'>('privacy');
  const [duplicateData, setDuplicateData] = useState<Product|null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const theme = THEMES[currentTheme];
  const t: any = TRANSLATIONS[language] || TRANSLATIONS.en; 

  // --- IAP Setup & Listeners (FIXED) ---
  useEffect(() => { 
      loadData(); 
      requestPermissions();
      
      const setupIAP = async () => {
        try {
          // Wir warten explizit auf die Verbindung
          await initConnection();
        } catch (err) {
          console.log("IAP Connection Error (harmless):", err);
        }
      };
      
      setupIAP();

const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: any) => {
  try {
    console.log("Purchase received:", purchase);

    const receipt = purchase.transactionReceipt;
    if (receipt) {

      // Transaktion abschließen
      await finishTransaction({ purchase });

      // Premium aktivieren
      setIsPremium(true);
      await AsyncStorage.setItem('isPremium', 'true');

      // Erfolg anzeigen
      setShowSuccess(true);
    }

  } catch (err) {
    console.warn("Fehler im purchaseUpdatedListener:", err);
    Alert.alert("Fehler", "Kauf konnte nicht bestätigt werden.");
  }
});

// --- PURCHASE ERROR LISTENER ---
const purchaseErrorSubscription = purchaseErrorListener((error: any) => {
  console.warn("IAP Error:", error);

  // cancel codes: 1 = user canceled, 2 = service unavailable
  if (error?.responseCode === 1 || error?.responseCode === 2) return;

  const msg = error.message || JSON.stringify(error);
  Alert.alert("Kauf fehlgeschlagen", msg);
});

// CLEANUP
return () => {
  purchaseUpdateSubscription?.remove?.();
  purchaseErrorSubscription?.remove?.();
  try { endConnection(); } catch(e) {}
};

  }, []);

  const requestPermissions = async () => { await Notifications.requestPermissionsAsync(); };
  
  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('products');
      if (stored) setProducts(JSON.parse(stored));
      const storedCats = await AsyncStorage.getItem('customCategories');
      if (storedCats) setCustomCategories(JSON.parse(storedCats));
      const premiumStatus = await AsyncStorage.getItem('isPremium');
      if (premiumStatus === 'true') setIsPremium(true);
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang && TRANSLATIONS[savedLang as Language]) {
          setLanguage(savedLang as Language);
      } else {
          setLanguage('en');
      }
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && THEMES[savedTheme as ThemeKey]) setCurrentTheme(savedTheme as ThemeKey);
      const onboarded = await AsyncStorage.getItem('hasOnboarded');
      if (onboarded === 'true') setHasOnboarded(true);
    } catch (e) { console.error(e); }
  };

  const changeLanguage = async (lang: Language) => { setLanguage(lang); await AsyncStorage.setItem('language', String(lang));  }
  const changeTheme = async (key: ThemeKey) => { setCurrentTheme(key); await AsyncStorage.setItem('theme', key); }
  const finishOnboarding = async () => { setHasOnboarded(true); await AsyncStorage.setItem('hasOnboarded', 'true'); }

  const triggerPremium = (reason: string) => { setPremiumReason(reason); setShowPremium(true); }
  const resetPremium = async () => { 
      await AsyncStorage.removeItem('isPremium'); 
      await AsyncStorage.removeItem('hasOnboarded'); 
      setIsPremium(false); 
      setHasOnboarded(false);
      Alert.alert("Reset", t.resetMsg); 
      changeTheme('beige'); 
  };

  // --- KAUF FUNKTION (REPARIERT UND ROBUST) ---
  const handleBuyPremium = async () => {
    try {
      // 1. Verbindung sicherstellen (falls sie beim Start nicht geklappt hat)
      

      // 2. Prüfen ob getProducts existiert (um "undefined is not a function" abzufangen)
      // @ts-ignore
      if (typeof getProducts !== 'function') {
         throw new Error("IAP Library Fehler: getProducts fehlt. Bitte App neu installieren.");
      }

      // 3. Produkte laden
      // @ts-ignore
// Produkte abrufen
const products = await getProducts(productIds);

if (!products || products.length === 0) {
  Alert.alert(
    "Fehler",
    "Produkt 'premium_unlock' wurde nicht gefunden.\n" +
    "Bitte stelle sicher, dass:\n" +
    "1) Die SKU exakt 'premium_unlock' heißt\n" +
    "2) Die App über den Play Store (nicht manuell) installiert wurde\n" +
    "3) Dein Account als Tester eingetragen ist"
  );
  return;
}

// Kauf starten
try {
await requestPurchase(productIds[0] as any);
} catch (err) {
  console.warn("Kaufen fehlgeschlagen:", err);
  Alert.alert("Fehler", "Kauf konnte nicht gestartet werden.");
  return;
}


      
    } catch (err: any) {
      const errorMsg = err?.message || JSON.stringify(err) || "Unbekannter Fehler";
      Alert.alert("IAP Fehler", errorMsg);
    }
  };

  const restorePurchases = async () => {
  try {
    const purchases = await getAvailablePurchases();
    let restored = false;

for (const purchase of purchases) {
  if (purchase.productId === PRODUCT_ID) {
 await finishTransaction({ purchase });
    setIsPremium(true);
    await AsyncStorage.setItem('isPremium', 'true');
    restored = true;
  }
}

    if (restored) {
      Alert.alert("Success", "Premium restored.");
    } else {
      Alert.alert("Info", "No purchases found.");
    }

  } catch (err) {
    Alert.alert("Error", "Restore failed.");
  }
};
  const addCustomCategory = async (cat: string) => { const newCats = [...customCategories, cat]; setCustomCategories(newCats); await AsyncStorage.setItem('customCategories', JSON.stringify(newCats)); }
  const deleteCustomCategory = async (cat: string) => { const newCats = customCategories.filter(c => c !== cat); setCustomCategories(newCats); await AsyncStorage.setItem('customCategories', JSON.stringify(newCats)); }

  const saveProduct = async (newProduct: Product) => {
    if (activeTab === 'add' && !isPremium && products.length >= 5) { triggerPremium(t.limitReached); return; }
    
    const notifIds: string[] = [];
    if (newProduct.notificationIds) { for (const id of newProduct.notificationIds) await Notifications.cancelScheduledNotificationAsync(id); }
    
    const [y, m, d] = newProduct.expiryDate.split('-').map(Number);
    const expiryDate = new Date(y, m - 1, d, 10, 0, 0);
    const now = new Date();

    for (const offset of newProduct.notificationOffsets) {
       const triggerDate = new Date(expiryDate);
       triggerDate.setDate(triggerDate.getDate() - offset);

       if (triggerDate.getTime() > (now.getTime() + 5 * 60 * 1000)) {
           try {
               const id = await Notifications.scheduleNotificationAsync({
                   content: { title: t.notificationTitle, body: t.notificationBody.replace('{{name}}', newProduct.name) },
                   trigger: { type: 'date', date: triggerDate } as any, 
               });
               notifIds.push(id);
           } catch (e) { }
       }
    }

    const finalProduct = { ...newProduct, notificationIds: notifIds };
    let updatedProducts;
    if (activeTab === 'edit') { updatedProducts = products.map(p => p.id === finalProduct.id ? finalProduct : p); setSelectedProductId(null); setActiveTab('dashboard'); } 
    else { updatedProducts = [finalProduct, ...products]; setActiveTab('dashboard'); }
    setProducts(updatedProducts); await AsyncStorage.setItem('products', JSON.stringify(updatedProducts)); setDuplicateData(null); 
  };

  const deleteProduct = async () => { if (!selectedProductId) return; const p = products.find(p => p.id === selectedProductId); if (p?.notificationIds) { for (const id of p.notificationIds) await Notifications.cancelScheduledNotificationAsync(id); } const updated = products.filter(p => p.id !== selectedProductId); setProducts(updated); await AsyncStorage.setItem('products', JSON.stringify(updated)); setSelectedProductId(null); setActiveTab('dashboard'); };
  const handleDuplicate = () => { if (!isPremium) { triggerPremium(t.duplicateUnlock); return; } const p = products.find(p => p.id === selectedProductId); if (p) { setDuplicateData({ ...p, id: '', notificationIds: [] }); setActiveTab('add'); } }
  const deleteExpired = async () => { Alert.alert(t.deleteTitle, t.deleteExpiredMsg, [ { text: t.cancel }, { text: t.delete, style: 'destructive', onPress: async () => { const now = new Date(); const newProds = products.filter(p => new Date(p.expiryDate) >= now); setProducts(newProds); await AsyncStorage.setItem('products', JSON.stringify(newProds)); }} ]) }
  const deleteAll = async () => { Alert.alert(t.deleteTitle, t.deleteAllMsg, [ { text: t.cancel }, { text: t.delete, style: 'destructive', onPress: async () => { setProducts([]); await AsyncStorage.setItem('products', JSON.stringify([])); }} ]) }
  const generateExportData = () => { let csv = `${t.nameLabel.replace('*','')},${t.brandLabel},${t.categoryLabel.replace('*','')},${t.openedLabel.replace('*','').split(' ')[0]},${t.expiryDate},Status\n`; let htmlRows = ""; const now = new Date(); products.forEach(p => { const status = new Date(p.expiryDate) < now ? t.expired : t.fresh; const displayCat = STANDARD_CATEGORIES_KEYS.includes(p.category) ? (t[p.category] || t.en?.[p.category]) : p.category; csv += `"${p.name}","${p.brand}","${displayCat}","${p.openedDate}","${p.expiryDate}","${status}"\n`; htmlRows += `<tr><td>${p.name}</td><td>${p.brand}</td><td>${displayCat}</td><td>${p.expiryDate}</td><td>${status}</td></tr>`; }); const html = `<html><body><h1>BeautyExpiry Export</h1><table border="1" style="width:100%;border-collapse:collapse;"><tr><th>${t.nameLabel.replace('*','')}</th><th>${t.brandLabel}</th><th>${t.categoryLabel.replace('*','')}</th><th>${t.expiryDate}</th><th>Status</th></tr>${htmlRows}</table></body></html>`; return { csv, html }; }
  
  const exportCSV = async () => { 
      try { 
          const { csv } = generateExportData(); 
          // FIX: String 'utf8' statt Enum verwenden, um Typfehler zu vermeiden
          // @ts-ignore
          const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'beauty_expiry.csv'; 
          // @ts-ignore
          await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' }); 
          await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export CSV' }); 
      } catch (e) { Alert.alert("Error", "Export failed"); } 
  }
  
  const exportPDF = async () => { const { html } = generateExportData(); const { uri } = await Print.printToFileAsync({ html }); await Sharing.shareAsync(uri); }

  const renderContent = () => {
      if (!hasOnboarded) return <OnboardingScreen onStart={finishOnboarding} onChangeLang={changeLanguage} currentLang={language} t={t} theme={theme} insets={insets} />
      switch (activeTab) {
          case 'dashboard': return <Dashboard products={products} onProductPress={(id: string) => { setSelectedProductId(id); setActiveTab('details'); }} customCategories={customCategories} lang={language} t={t} theme={theme} />;
          case 'add': return <ProductForm mode="add" initialProduct={duplicateData} onSave={saveProduct} onCancel={() => { setDuplicateData(null); setActiveTab('dashboard'); }} isPremium={isPremium} onTriggerPremium={(r: any) => triggerPremium(r)} customCategories={customCategories} onManageCategories={() => setActiveTab('manageCategories')} t={t} theme={theme} />;
          case 'settings': return <SettingsScreen isPremium={isPremium} onPremiumPress={() => triggerPremium(t.premiumFeature)} onResetPremium={resetPremium} onManageCategories={() => setActiveTab('manageCategories')} onChangeLang={changeLanguage} currentLang={language} t={t} theme={theme} onSetTheme={changeTheme} currentTheme={currentTheme} onExportCSV={exportCSV} onExportPDF={exportPDF} onDeleteExpired={deleteExpired} onDeleteAll={deleteAll} onShowLegal={(type: 'privacy'|'terms') => { setLegalType(type); setLegalModalVisible(true); }} onRestorePurchase={restorePurchases} />;
          case 'manageCategories': return <ManageCategoriesScreen customCategories={customCategories} onAddCategory={addCustomCategory} onDeleteCategory={deleteCustomCategory} onBack={() => setActiveTab('settings')} t={t} theme={theme} />
          case 'details': const selected = products.find(p => p.id === selectedProductId); if (!selected) return <Dashboard products={products} onProductPress={() => {}} customCategories={customCategories} lang={language} t={t} theme={theme} />; return <ProductDetails product={selected} onBack={() => setActiveTab('dashboard')} onEdit={() => setActiveTab('edit')} onDelete={deleteProduct} onDuplicate={handleDuplicate} t={t} theme={theme} />
          case 'edit': const productToEdit = products.find(p => p.id === selectedProductId); return <ProductForm mode="edit" initialProduct={productToEdit} onSave={saveProduct} onCancel={() => setActiveTab('details')} isPremium={isPremium} onTriggerPremium={(r: any) => triggerPremium(r)} customCategories={customCategories} onManageCategories={() => setActiveTab('manageCategories')} t={t} theme={theme} />;
          default: return null;
      }
  };

  return (
    <View style={[styles.appContainer, { paddingTop: insets.top, backgroundColor: theme.colors.bg }]}>
      <ExpoStatusBar style={currentTheme === 'dark' ? "light" : "dark"} />
      <View style={styles.mainContent}>{renderContent()}</View>
      {hasOnboarded && ['dashboard', 'settings'].includes(activeTab) && (
          <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 15), height: 65 + Math.max(insets.bottom, 0), backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border }]}>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dashboard')}><Home color={activeTab === 'dashboard' ? theme.colors.text : theme.colors.subText} /><Text style={[styles.tabText, {color: activeTab === 'dashboard' ? theme.colors.text : theme.colors.subText}]}>{t.dashboard}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => { setDuplicateData(null); setActiveTab('add'); }}><Plus color={activeTab === 'add' ? theme.colors.text : theme.colors.subText} /><Text style={[styles.tabText, {color: activeTab === 'add' ? theme.colors.text : theme.colors.subText}]}>{t.add}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('settings')}><Settings color={activeTab === 'settings' ? theme.colors.text : theme.colors.subText} /><Text style={[styles.tabText, {color: activeTab === 'settings' ? theme.colors.text : theme.colors.subText}]}>{t.settings}</Text></TouchableOpacity>
          </View>
      )}
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} onBuy={handleBuyPremium} reason={premiumReason} t={t} theme={theme} />
      <SuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} t={t} theme={theme} />
      <LegalModal visible={legalModalVisible} onClose={() => setLegalModalVisible(false)} type={legalType} lang={language} t={t} theme={theme} />
    </View>
  );
}

export default function App() { return ( <SafeAreaProvider><MainApp /></SafeAreaProvider> ); }

const styles = StyleSheet.create({
  appContainer: { flex: 1 },
  mainContent: { flex: 1 },
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 15, marginTop: 10 },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', padding: 10, borderRadius: 12, marginTop: 10, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  scrollContent: { paddingBottom: 120 }, 
  card: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  productImage: { width: 80, height: 80, borderRadius: 12, marginRight: 0 }, 
  productImagePlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  divider: { height: 1 },
  imageSection: { marginBottom: 20 },
  imageBtn: { flex: 1, height: 80, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#999', alignItems: 'center', justifyContent: 'center', gap: 5 },
  imageBtnText: { fontSize: 12 },
  formContainer: { paddingBottom: 50 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  activeChip: { },
  chipText: { },
  activeChipText: { },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  activeFilterChip: { },
  filterChipText: { fontWeight: '600' },
  activeFilterChipText: { },
  saveButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  saveButtonText: { fontWeight: 'bold', fontSize: 16 },
  productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  brandText: { fontSize: 14 },
  dateText: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  sectionHeader: { fontSize: 12, marginTop: 20, marginBottom: 10, letterSpacing: 1, color: '#888' },
  settingItem: { padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingText: { fontSize: 16 },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  premiumBanner: { padding: 20, borderWidth: 1, borderColor: '#C7A05F', borderRadius: 16, marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
  tabItem: { alignItems: 'center', gap: 4 },
  tabText: { fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  closeModal: { alignSelf: 'flex-end', padding: 5 },
  buyButton: { padding: 18, borderRadius: 16, alignItems: 'center' },
  buyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 8 },
  langItem: { padding: 15, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }
});