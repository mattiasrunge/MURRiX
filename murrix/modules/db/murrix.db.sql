SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `Attributes` (
  `node_id` int(11) unsigned NOT NULL,
  `name` text COLLATE utf8_bin NOT NULL,
  `value` longtext COLLATE utf8_bin NOT NULL,
  KEY `node_id` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE IF NOT EXISTS `Links` (
  `node_id_up` int(10) unsigned NOT NULL,
  `node_id_down` int(10) unsigned NOT NULL,
  `role` varchar(128) COLLATE utf8_bin NOT NULL,
  KEY `node_id_up` (`node_id_up`),
  KEY `node_id_down` (`node_id_down`),
  KEY `role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE IF NOT EXISTS `Nodes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(32) COLLATE utf8_bin NOT NULL,
  `name` varchar(128) COLLATE utf8_bin NOT NULL,
  `created` timestamp NULL DEFAULT NULL,
  `modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `type` (`type`,`name`),
  KEY `type_2` (`type`),
  KEY `modified` (`modified`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin ;


ALTER TABLE `Attributes`
  ADD CONSTRAINT `Attributes_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `Nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Links`
  ADD CONSTRAINT `Links_ibfk_1` FOREIGN KEY (`node_id_up`) REFERENCES `Nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Links_ibfk_2` FOREIGN KEY (`node_id_down`) REFERENCES `Nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
