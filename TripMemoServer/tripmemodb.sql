-- MySQL dump 10.13  Distrib 8.2.0, for Win64 (x86_64)
--
-- Host: localhost    Database: tripmemodb
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `memory_id` bigint DEFAULT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  CONSTRAINT `fk_activity_log_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_activity_log_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audios`
--

DROP TABLE IF EXISTS `audios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audios` (
  `audio_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `thumbnail_id` bigint DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_bytes` bigint DEFAULT NULL,
  `media_type_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mp3',
  `position_data` json DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `tag` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'song',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `artist` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`audio_id`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_tag` (`tag`),
  KEY `fk_audios_thumbnails` (`thumbnail_id`),
  KEY `fk_audios_media_types` (`media_type_code`),
  CONSTRAINT `fk_audios_media_types` FOREIGN KEY (`media_type_code`) REFERENCES `media_types` (`type_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_audios_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_audios_thumbnails` FOREIGN KEY (`thumbnail_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audios`
--

LOCK TABLES `audios` WRITE;
/*!40000 ALTER TABLE `audios` DISABLE KEYS */;
/*!40000 ALTER TABLE `audios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avatar_applied_customizations`
--

DROP TABLE IF EXISTS `avatar_applied_customizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avatar_applied_customizations` (
  `avatar_id` bigint NOT NULL,
  `option_id` bigint NOT NULL,
  `custom_color_hex` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `custom_scale` decimal(5,2) DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`avatar_id`,`option_id`),
  KEY `idx_avatar_id` (`avatar_id`),
  KEY `fk_avatar_applied_customizations_options` (`option_id`),
  CONSTRAINT `fk_avatar_applied_customizations_avatars` FOREIGN KEY (`avatar_id`) REFERENCES `user_avatars` (`avatar_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_avatar_applied_customizations_options` FOREIGN KEY (`option_id`) REFERENCES `avatar_customization_options` (`option_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avatar_applied_customizations`
--

LOCK TABLES `avatar_applied_customizations` WRITE;
/*!40000 ALTER TABLE `avatar_applied_customizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `avatar_applied_customizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avatar_base_models`
--

DROP TABLE IF EXISTS `avatar_base_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avatar_base_models` (
  `model_id` bigint NOT NULL AUTO_INCREMENT,
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `model_file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_image_id` bigint DEFAULT NULL,
  `model_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'glb',
  `file_size_bytes` bigint DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_premium` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`model_id`),
  UNIQUE KEY `model_name_UNIQUE` (`model_name`),
  KEY `idx_model_name` (`model_name`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`),
  KEY `fk_avatar_base_models_thumbnails` (`thumbnail_image_id`),
  CONSTRAINT `fk_avatar_base_models_thumbnails` FOREIGN KEY (`thumbnail_image_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avatar_base_models`
--

LOCK TABLES `avatar_base_models` WRITE;
/*!40000 ALTER TABLE `avatar_base_models` DISABLE KEYS */;
/*!40000 ALTER TABLE `avatar_base_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avatar_customization_options`
--

DROP TABLE IF EXISTS `avatar_customization_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avatar_customization_options` (
  `option_id` bigint NOT NULL AUTO_INCREMENT,
  `option_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asset_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnail_image_id` bigint DEFAULT NULL,
  `color_hex` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`option_id`),
  KEY `idx_option_type` (`option_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `fk_avatar_customization_options_thumbnails` (`thumbnail_image_id`),
  CONSTRAINT `fk_avatar_customization_options_thumbnails` FOREIGN KEY (`thumbnail_image_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avatar_customization_options`
--

LOCK TABLES `avatar_customization_options` WRITE;
/*!40000 ALTER TABLE `avatar_customization_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `avatar_customization_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avatar_poses`
--

DROP TABLE IF EXISTS `avatar_poses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avatar_poses` (
  `pose_id` bigint NOT NULL AUTO_INCREMENT,
  `pose_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `pose_data` json NOT NULL,
  `thumbnail_image_id` bigint DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pose_id`),
  UNIQUE KEY `pose_name_UNIQUE` (`pose_name`),
  KEY `idx_pose_name` (`pose_name`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`),
  KEY `fk_avatar_poses_thumbnails` (`thumbnail_image_id`),
  CONSTRAINT `fk_avatar_poses_thumbnails` FOREIGN KEY (`thumbnail_image_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avatar_poses`
--

LOCK TABLES `avatar_poses` WRITE;
/*!40000 ALTER TABLE `avatar_poses` DISABLE KEYS */;
/*!40000 ALTER TABLE `avatar_poses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `external_media`
--

DROP TABLE IF EXISTS `external_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `external_media` (
  `external_media_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_data` json DEFAULT NULL,
  `media_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `external_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`external_media_id`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_media_type` (`media_type`),
  CONSTRAINT `fk_external_media_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `external_media`
--

LOCK TABLES `external_media` WRITE;
/*!40000 ALTER TABLE `external_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `external_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_bytes` bigint DEFAULT NULL,
  `media_type_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'jpeg',
  `position_data` json DEFAULT NULL,
  `tag` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  UNIQUE KEY `file_path_UNIQUE` (`file_path`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_file_path` (`file_path`),
  KEY `idx_tag` (`tag`),
  KEY `fk_images_media_types` (`media_type_code`),
  CONSTRAINT `fk_images_media_types` FOREIGN KEY (`media_type_code`) REFERENCES `media_types` (`type_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_images_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `location_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `location_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `idx_memory_id` (`memory_id`),
  CONSTRAINT `fk_locations_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_types`
--

DROP TABLE IF EXISTS `media_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_types` (
  `type_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`type_code`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_types`
--

LOCK TABLES `media_types` WRITE;
/*!40000 ALTER TABLE `media_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `media_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memories`
--

DROP TABLE IF EXISTS `memories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memories` (
  `memory_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `memory_start` timestamp NOT NULL,
  `memory_end` timestamp NULL DEFAULT NULL,
  `context` text COLLATE utf8mb4_unicode_ci,
  `theme_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scrapbook',
  `elements` json DEFAULT NULL,
  `privacy_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`memory_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_theme_code` (`theme_code`),
  CONSTRAINT `fk_memories_themes` FOREIGN KEY (`theme_code`) REFERENCES `themes` (`theme_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_memories_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memories`
--

LOCK TABLES `memories` WRITE;
/*!40000 ALTER TABLE `memories` DISABLE KEYS */;
INSERT INTO `memories` VALUES (16,'10101010','Beach Day','2025-12-03 03:27:25','2025-12-03 03:27:25','Sunny day at the beach','scrapbook','{\"mood\": \"happy\", \"photos\": 4}','public',0,'2025-12-03 03:27:25','2025-12-03 03:27:25',NULL,''),(17,'10101011','Birthday Dinner','2025-12-03 03:27:25','2025-12-03 03:27:25','Dinner with friends at Nandos','scrapbook','{\"food\": \"chicken\", \"photos\": 2}','private',1,'2025-12-03 03:27:25','2025-12-03 03:27:25',NULL,''),(18,'10101012','Baking Night','2025-12-03 03:27:25','2025-12-03 03:27:25','Tried a new chocolate cake recipe','scrapbook','{\"steps\": 5, \"taste\": \"amazing\"}','public',0,'2025-12-03 03:27:25','2025-12-03 03:27:25',NULL,''),(19,'10101013','Anime Marathon','2025-12-03 03:27:25','2025-12-03 03:27:25','Watched 12 episodes straight','scrapbook','{\"hours\": 6, \"series\": \"JJK\"}','friends_only',0,'2025-12-03 03:27:25','2025-12-03 03:27:25',NULL,''),(20,'10101019','Volleyball Match','2025-12-03 03:27:25','2025-12-03 03:27:25','went on a walk','scrapbook','{}','public',1,'2025-12-03 03:27:25','2025-12-03 03:27:25',NULL,''),(26,'10101019','presentation','0000-00-00 00:00:00',NULL,NULL,'scrapbook','[]','private',0,'2025-12-03 10:44:36','2025-12-03 10:44:36',NULL,''),(27,'10101019','cool','0000-00-00 00:00:00',NULL,NULL,'scrapbook','[]','private',0,'2025-12-10 10:36:44','2025-12-10 10:36:44',NULL,''),(28,'10101019','japan 2026','0000-00-00 00:00:00',NULL,NULL,'scrapbook','[]','private',0,'2026-01-25 17:39:18','2026-01-25 17:39:18',NULL,''),(29,'0910837e-fd2f-11f0-a1f0-50ebf6e3239c','presentation','0000-00-00 00:00:00',NULL,NULL,'scrapbook','[]','private',0,'2026-02-08 15:17:40','2026-02-08 15:17:40',NULL,''),(30,'0910837e-fd2f-11f0-a1f0-50ebf6e3239c','ana ','0000-00-00 00:00:00',NULL,NULL,'scrapbook','[]','private',0,'2026-02-08 20:21:34','2026-02-08 20:21:34',NULL,'');
/*!40000 ALTER TABLE `memories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memory_avatars`
--

DROP TABLE IF EXISTS `memory_avatars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memory_avatars` (
  `memory_avatar_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `avatar_id` bigint NOT NULL,
  `pose_id` bigint DEFAULT NULL,
  `position_data` json NOT NULL,
  `scale` decimal(5,2) DEFAULT '1.00',
  `rotation_data` json DEFAULT NULL,
  `z_index` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`memory_avatar_id`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_avatar_id` (`avatar_id`),
  KEY `fk_memory_avatars_poses` (`pose_id`),
  CONSTRAINT `fk_memory_avatars_avatars` FOREIGN KEY (`avatar_id`) REFERENCES `user_avatars` (`avatar_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_memory_avatars_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_memory_avatars_poses` FOREIGN KEY (`pose_id`) REFERENCES `avatar_poses` (`pose_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memory_avatars`
--

LOCK TABLES `memory_avatars` WRITE;
/*!40000 ALTER TABLE `memory_avatars` DISABLE KEYS */;
/*!40000 ALTER TABLE `memory_avatars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memory_people`
--

DROP TABLE IF EXISTS `memory_people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memory_people` (
  `memory_id` bigint NOT NULL,
  `person_id` bigint NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`memory_id`,`person_id`),
  KEY `idx_person_id` (`person_id`),
  CONSTRAINT `fk_memory_people_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_memory_people_people` FOREIGN KEY (`person_id`) REFERENCES `people` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memory_people`
--

LOCK TABLES `memory_people` WRITE;
/*!40000 ALTER TABLE `memory_people` DISABLE KEYS */;
/*!40000 ALTER TABLE `memory_people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memory_shares`
--

DROP TABLE IF EXISTS `memory_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memory_shares` (
  `share_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `shared_with_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'view',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`share_id`),
  UNIQUE KEY `memory_user_UNIQUE` (`memory_id`,`shared_with_user_id`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_shared_with_user_id` (`shared_with_user_id`),
  CONSTRAINT `fk_memory_shares_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_memory_shares_users` FOREIGN KEY (`shared_with_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memory_shares`
--

LOCK TABLES `memory_shares` WRITE;
/*!40000 ALTER TABLE `memory_shares` DISABLE KEYS */;
/*!40000 ALTER TABLE `memory_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memory_tags`
--

DROP TABLE IF EXISTS `memory_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memory_tags` (
  `memory_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`memory_id`,`tag_id`),
  KEY `idx_tag_id` (`tag_id`),
  CONSTRAINT `fk_memory_tags_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_memory_tags_tags` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memory_tags`
--

LOCK TABLES `memory_tags` WRITE;
/*!40000 ALTER TABLE `memory_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `memory_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `people`
--

DROP TABLE IF EXISTS `people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `people` (
  `person_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `sex` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occupation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relationship` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` decimal(4,2) DEFAULT NULL,
  `avatar_image_id` bigint DEFAULT NULL,
  `additional_information` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`person_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_nickname` (`user_id`,`nickname`),
  KEY `fk_people_avatar_images` (`avatar_image_id`),
  CONSTRAINT `fk_people_avatar_images` FOREIGN KEY (`avatar_image_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_people_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people`
--

LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
/*!40000 ALTER TABLE `people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_usage`
--

DROP TABLE IF EXISTS `storage_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storage_usage` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_bytes_used` bigint NOT NULL DEFAULT '0',
  `quota_bytes` bigint NOT NULL DEFAULT '5368709120',
  `image_count` int NOT NULL DEFAULT '0',
  `video_count` int NOT NULL DEFAULT '0',
  `audio_count` int NOT NULL DEFAULT '0',
  `last_calculated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_storage_usage_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_usage`
--

LOCK TABLES `storage_usage` WRITE;
/*!40000 ALTER TABLE `storage_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `storage_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `tag_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `user_tag_UNIQUE` (`user_id`,`tag_name`),
  CONSTRAINT `fk_tags_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `themes`
--

DROP TABLE IF EXISTS `themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `themes` (
  `theme_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`theme_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `themes`
--

LOCK TABLES `themes` WRITE;
/*!40000 ALTER TABLE `themes` DISABLE KEYS */;
INSERT INTO `themes` VALUES ('scrapbook','Scrapbook Theme','Default theme for memories','2025-12-03 03:25:54');
/*!40000 ALTER TABLE `themes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_avatars`
--

DROP TABLE IF EXISTS `user_avatars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_avatars` (
  `avatar_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_model_id` bigint NOT NULL,
  `customization_data` json NOT NULL,
  `thumbnail_image_id` bigint DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`avatar_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_default` (`user_id`,`is_default`),
  KEY `fk_user_avatars_base_models` (`base_model_id`),
  KEY `fk_user_avatars_thumbnails` (`thumbnail_image_id`),
  CONSTRAINT `fk_user_avatars_base_models` FOREIGN KEY (`base_model_id`) REFERENCES `avatar_base_models` (`model_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_user_avatars_thumbnails` FOREIGN KEY (`thumbnail_image_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_avatars_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_avatars`
--

LOCK TABLES `user_avatars` WRITE;
/*!40000 ALTER TABLE `user_avatars` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_avatars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_settings` json DEFAULT NULL,
  `user_profile` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'User',
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'User',
  `account_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  CONSTRAINT `chk_user_profile_json` CHECK (((`user_profile` is null) or json_valid(`user_profile`))),
  CONSTRAINT `chk_user_settings_json` CHECK (((`user_settings` is null) or json_valid(`user_settings`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('0910837e-fd2f-11f0-a1f0-50ebf6e3239c','timthii16@gmail.com','timthii16@gmail.com','$2b$10$G/smqE9aQyf1Mm/ZI1kHheMvzmMymnIa2UGAlDbjYPI0Bvfj/QrWu',NULL,NULL,'2026-01-29 16:24:50','2026-01-29 16:24:50',NULL,'Timothy','Ishola','user'),('10101010','mariam','mariam@example.com','hash_abc123',NULL,'[{\"interest\": \"volleyball\", \"confidence\": 5}, {\"interest\": \"cake\", \"confidence\": 5}, {\"interest\": \"nike\", \"confidence\": 5}, {\"interest\": \"anime\", \"confidence\": 5}]','2025-11-30 19:04:39','2026-01-28 21:39:48',NULL,'User','User','test'),('10101011','jordan','jordan@example.com','hash_jd921',NULL,'[{\"interest\": \"basketball\", \"confidence\": 5}, {\"interest\": \"nike\", \"confidence\": 5}, {\"interest\": \"gaming\", \"confidence\": 5}, {\"interest\": \"anime\", \"confidence\": 5}]','2025-11-30 19:04:39','2026-01-28 21:39:48',NULL,'User','User','test'),('10101012','sugarqueen','sugar@example.com','hash_sg441',NULL,'[{\"interest\": \"cake\", \"confidence\": 5}, {\"interest\": \"baking\", \"confidence\": 5}, {\"interest\": \"chocolate\", \"confidence\": 5}, {\"interest\": \"volleyball\", \"confidence\": 5}]','2025-11-30 19:04:39','2026-01-28 21:39:48',NULL,'User','User','test'),('10101013','ren','ren@example.com','hash_rn553',NULL,'[{\"interest\": \"anime\", \"confidence\": 5}, {\"interest\": \"manga\", \"confidence\": 5}, {\"interest\": \"gaming\", \"confidence\": 5}, {\"interest\": \"nike\", \"confidence\": 5}]','2025-11-30 19:04:39','2026-01-28 21:39:48',NULL,'User','User','test'),('10101014','vballstar','vball@example.com','hash_vb777',NULL,'[{\"interest\": \"volleyball\", \"confidence\": 5}, {\"interest\": \"gym\", \"confidence\": 5}, {\"interest\": \"anime\", \"confidence\": 5}, {\"interest\": \"cake\", \"confidence\": 5}]','2025-11-30 19:04:39','2026-01-28 21:39:48',NULL,'User','User','test'),('10101018','schannie','shcannie@example.com','hash_sc777',NULL,'[{\"interest\": \"Esspresso Martini\", \"confidence\": 5}, {\"interest\": \"Harry potter\", \"confidence\": 5}, {\"interest\": \"Camebridge\", \"confidence\": 5}, {\"interest\": \"Mary Mullens\", \"confidence\": 5}]','2025-11-30 19:55:46','2026-01-28 21:39:48',NULL,'User','User','test'),('10101019','Tim','tim@example.com','$2b$10$2nyFJlG8tG9nGtgGQ2ay2uVHb3rbM.J9mUKPsgl9Lgyjd9locw6ae',NULL,'[{\"interest\": \"galway christmas market\", \"confidence\": 5}, {\"interest\": \"galway\", \"confidence\": 5}, {\"interest\": \"cake\", \"confidence\": 5}, {\"interest\": \"volleyball\", \"confidence\": 5}]','2025-12-01 01:48:28','2026-01-28 21:39:48',NULL,'User','User','test'),('8fd43af9-fc89-11f0-a1f0-50ebf6e3239c','testuser','test@example.com','$2b$10$ZYs24c4bUV595pRL0CMMc.j3.Wc2l8Wz7k7FdhwxFRuwg9ehP7wU2',NULL,NULL,'2026-01-28 20:40:20','2026-01-28 21:39:48',NULL,'Test','User','test');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `video_id` bigint NOT NULL AUTO_INCREMENT,
  `memory_id` bigint NOT NULL,
  `thumbnail_id` bigint DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_bytes` bigint DEFAULT NULL,
  `media_type_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mp4',
  `position_data` json DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`video_id`),
  KEY `idx_memory_id` (`memory_id`),
  KEY `idx_file_path` (`file_path`),
  KEY `fk_videos_thumbnails` (`thumbnail_id`),
  KEY `fk_videos_media_types` (`media_type_code`),
  CONSTRAINT `fk_videos_media_types` FOREIGN KEY (`media_type_code`) REFERENCES `media_types` (`type_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_videos_memories` FOREIGN KEY (`memory_id`) REFERENCES `memories` (`memory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_videos_thumbnails` FOREIGN KEY (`thumbnail_id`) REFERENCES `images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-12 11:06:06
