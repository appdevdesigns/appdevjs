-- MySQL dump 10.13  Distrib 5.1.44, for apple-darwin8.11.1 (i386)
--
-- Host: localhost    Database: live_db
-- ------------------------------------------------------
-- Server version	5.1.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `[dbName]`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `[dbName]` /*!40100 DEFAULT CHARACTER SET [dbCharset] */;

USE `[dbName]`;




DROP TABLE IF EXISTS `site_multilingual_label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_multilingual_label` (
  `label_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `language_code` varchar(10) NOT NULL,
  `label_key` text,
  `label_label` text,
  `label_lastMod` datetime DEFAULT NULL,
  `label_needs_translation` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `label_path` text,
  PRIMARY KEY (`label_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `site_multilingual_language`
--

DROP TABLE IF EXISTS `site_multilingual_language`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_multilingual_language` (
  `language_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `language_code` varchar(10) NOT NULL,
  `language_label` text,
  PRIMARY KEY (`language_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_multilingual_language`
--

LOCK TABLES `site_multilingual_language` WRITE;
/*!40000 ALTER TABLE `site_multilingual_language` DISABLE KEYS */;
INSERT INTO `site_multilingual_language` VALUES [langList];
/*!40000 ALTER TABLE `site_multilingual_language` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `site_perm_tasks`
--

DROP TABLE IF EXISTS `site_perm_tasks_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_perm_tasks_data` (
  `task_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_key` varchar(25) NOT NULL,
  PRIMARY KEY (`task_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `site_perm_tasks_trans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_perm_tasks_trans` (
  `trans_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL DEFAULT 0,
  `language_code` varchar(25) NOT NULL DEFAULT '',
  `task_label` TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (`trans_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Dumping data for table `site_perm_tasks`
--

LOCK TABLES `site_perm_tasks_data` WRITE;
/*!40000 ALTER TABLE `site_perm_tasks_data` DISABLE KEYS */;
INSERT INTO `site_perm_tasks_data` VALUES (1,'site.admin.accounts.create'),(2,'site.admin.switcheroo');
/*!40000 ALTER TABLE `site_perm_tasks_data` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `site_perm_tasks_trans` WRITE;
/*!40000 ALTER TABLE `site_perm_tasks_trans` DISABLE KEYS */;
INSERT INTO `site_perm_tasks_trans` VALUES (1,1,'[langDefault]','Admin: Create Account'),(2,2,'[langDefault]','Admin: Switcheroo');
/*!40000 ALTER TABLE `site_perm_tasks_trans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_perm_role_tasks`
--

DROP TABLE IF EXISTS `site_perm_role_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_perm_role_tasks` (
  `roletask_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  PRIMARY KEY (`roletask_id`),
  KEY `role_id` (`role_id`),
  KEY `task_id` (`task_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_perm_role_tasks`
--

LOCK TABLES `site_perm_role_tasks` WRITE;
/*!40000 ALTER TABLE `site_perm_role_tasks` DISABLE KEYS */;
INSERT INTO `site_perm_role_tasks` VALUES (1,1,1),(2,1,2);
/*!40000 ALTER TABLE `site_perm_role_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_perm_roles`
--

DROP TABLE IF EXISTS `site_perm_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_perm_roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_label` text NOT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_perm_roles`
--

LOCK TABLES `site_perm_roles` WRITE;
/*!40000 ALTER TABLE `site_perm_roles` DISABLE KEYS */;
INSERT INTO `site_perm_roles` VALUES (1,'root'),(2,'Admin'),(3,'Guest');
/*!40000 ALTER TABLE `site_perm_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_perm_viewer_roles`
--

DROP TABLE IF EXISTS `site_perm_viewer_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_perm_viewer_roles` (
  `viewerroles_id` int(11) NOT NULL AUTO_INCREMENT,
  `viewer_guid` text NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`viewerroles_id`),
  KEY `role_id` (`role_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_perm_viewer_roles`
--

LOCK TABLES `site_perm_viewer_roles` WRITE;
/*!40000 ALTER TABLE `site_perm_viewer_roles` DISABLE KEYS */;
INSERT INTO `site_perm_viewer_roles` VALUES (1,'[adminUserID]',1);
INSERT INTO `site_perm_viewer_roles` VALUES (2,'steal',2);
/*!40000 ALTER TABLE `site_perm_viewer_roles` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `site_system`
--

DROP TABLE IF EXISTS `site_system`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_system` (
  `system_id` int(11) NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) NOT NULL DEFAULT '',
  `system_path` varchar(255) NOT NULL DEFAULT '',
  `system_type` varchar(12) NOT NULL DEFAULT '',
  PRIMARY KEY (`system_id`)
) ENGINE=MyISAM;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_system`
--

LOCK TABLES `site_system` WRITE;
/*!40000 ALTER TABLE `site_system` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_system` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_settings` (
  `settings_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `settings_key` text,
  `settings_value` text,
  PRIMARY KEY (`settings_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES (1,'siteDefaultModuleKey','HRIS'),(2,'siteDefaultActionKey','HRIS'),(3,'siteDefaultLanguage','[langDefault]'),(4,'siteDefaultTheme','default');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings_viewer`
--

DROP TABLE IF EXISTS `site_settings_viewer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_settings_viewer` (
  `settingsviewer_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `viewer_globalUserID` text,
  `settingsviewer_key` text,
  `settingsviewer_value` text,
  PRIMARY KEY (`settingsviewer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings_viewer`
--

LOCK TABLES `site_settings_viewer` WRITE;
/*!40000 ALTER TABLE `site_settings_viewer` DISABLE KEYS */;
INSERT INTO `site_settings_viewer` VALUES (1,'[adminUserID]','lastViewModule','AC');
/*!40000 ALTER TABLE `site_settings_viewer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_viewer`
--

DROP TABLE IF EXISTS `site_viewer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_viewer` (
  `viewer_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `language_key` varchar(12) NOT NULL DEFAULT '[langDefault]',
  `viewer_passWord` text,
  `viewer_userID` text,
  `viewer_isActive` int(1) NOT NULL DEFAULT '0',
  `viewer_lastLogin` datetime DEFAULT NULL,
  `viewer_globalUserID` text,
  PRIMARY KEY (`viewer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_viewer`
--

LOCK TABLES `site_viewer` WRITE;
/*!40000 ALTER TABLE `site_viewer` DISABLE KEYS */;
INSERT INTO `site_viewer` VALUES (1,'[adminLanguage]','[adminPWord]','[adminUserID]',1,'2008-08-08 18:08:08','[adminUserID]');
INSERT INTO `site_viewer` VALUES (2,'en',MD5('steal'),'steal',1,'2008-08-08 18:08:08','steal');
/*!40000 ALTER TABLE `site_viewer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_viewer_switcheroo`
--

DROP TABLE IF EXISTS `site_viewer_switcheroo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = [dbCharset] */;
CREATE TABLE `site_viewer_switcheroo` (
  `switcheroo_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `switcheroo_realID` text,
  `switcheroo_fakeID` text,
  PRIMARY KEY (`switcheroo_id`)
) ENGINE=MyISAM DEFAULT CHARSET=[dbCharset];
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_viewer_switcheroo`
--

LOCK TABLES `site_viewer_switcheroo` WRITE;
/*!40000 ALTER TABLE `site_viewer_switcheroo` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_viewer_switcheroo` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2011-09-14 13:00:39
