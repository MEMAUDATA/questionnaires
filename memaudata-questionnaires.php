<?php
/**
 * Plugin Name:       MEMAUDATA Questionnaires
 * Plugin URI:        https://github.com/MEMAUDATA/questionnaires
 * Description:       Questionnaires cliniques MEMAUDATA. Shortcode : [memaudata q="HADS"] ou [memaudata q="AUTRES/HADS"]
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Nicolas Vannson
 * License:           EUPL-1.2
 * License URI:       https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MEMAUDATA_ROOT', plugin_dir_path(__FILE__));
define('MEMAUDATA_HTML2PDF_URL', 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');

/**
 * Trouve le fichier d'un questionnaire dans l'arborescence du dépôt.
 *  - "PROMS/HADS" : chemin explicite (dossier/nom, sans .html)
 *  - "HADS"       : recherche dans tous les sous-dossiers ; refusé si le nom existe dans plusieurs dossiers
 * Retourne [chemin|null, message d'erreur|null].
 */
function memaudata_find_questionnaire($q) {
    $segments = array_values(array_filter(explode('/', (string) $q), 'strlen'));
    foreach ($segments as $s) {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $s)) {
            return [null, 'identifiant invalide'];
        }
    }
    if (!$segments) {
        return [null, 'identifiant manquant'];
    }

    if (count($segments) > 1) {
        $file = MEMAUDATA_ROOT . implode('/', $segments) . '.html';
        return is_readable($file) ? [$file, null] : [null, 'fichier introuvable'];
    }

    $name    = $segments[0] . '.html';
    $matches = [];
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(MEMAUDATA_ROOT, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $f) {
        $path = $f->getPathname();
        if ($f->getFilename() === $name && strpos($path, '/node_modules/') === false && strpos($path, '/.git/') === false) {
            $matches[] = $path;
        }
    }
    if (count($matches) === 1) {
        return [$matches[0], null];
    }
    return [null, $matches ? 'nom ambigu, préciser le dossier (ex. q="PROMS/' . $segments[0] . '")' : 'fichier introuvable'];
}

/**
 * Insère le contenu <body> du questionnaire dans <div class="mdq">.
 * Une seule instance par page : les scripts des questionnaires utilisent des noms globaux.
 */
add_shortcode('memaudata', function ($atts) {
    $atts = shortcode_atts(['q' => ''], $atts, 'memaudata');
    [$file, $error] = memaudata_find_questionnaire($atts['q']);

    if ($error) {
        return current_user_can('edit_posts')
            ? '<p><strong>MEMAUDATA :</strong> ' . esc_html($error) . ' (' . esc_html($atts['q']) . ').</p>'
            : '';
    }

    $html = file_get_contents($file);
    if ($html === false || !preg_match('/<body[^>]*>(.*)<\/body>/is', $html, $m)) {
        return '';
    }

    // Seul le <body> est injecté : les <script src> du <head> sont perdus.
    // On charge donc ici, depuis le plugin, les scripts UTILS/ que le fichier référence.
    wp_enqueue_script('memaudata-html2pdf', MEMAUDATA_HTML2PDF_URL, [], '0.10.1', true);
    if (preg_match_all('#<script[^>]+src=["\'][^"\']*UTILS/([A-Za-z0-9_-]+)\.js#i', $html, $scripts)) {
        foreach (array_unique($scripts[1]) as $name) {
            $path = MEMAUDATA_ROOT . 'UTILS/' . $name . '.js';
            if (!is_readable($path)) {
                continue;
            }
            wp_enqueue_script(
                'memaudata-' . $name,
                plugins_url('UTILS/' . $name . '.js', __FILE__),
                $name === 'exporterPDF' ? ['memaudata-html2pdf'] : [],
                filemtime($path),
                true
            );
        }
    }
    wp_enqueue_style('memaudata-style', plugins_url('style.css', __FILE__), [], filemtime(MEMAUDATA_ROOT . 'style.css'));

    return '<div class="mdq" data-questionnaire="' . esc_attr(basename($file, '.html')) . '">' . $m[1] . '</div>';
});