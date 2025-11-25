<?php

namespace App\Services;

class YandexScraperService
{
    protected string $nodePath;
    protected string $scriptPath;

    public function __construct()
    {
        $this->nodePath = PHP_OS_FAMILY === 'Windows'
            ? 'C:\\Program Files\\nodejs\\node.exe'
            : '/usr/bin/node';

        $this->scriptPath = base_path('external-scripts/yandex_reviews.js'); // путь к твоему Puppeteer скрипту
    }

    /**
     * Получить отзывы по ссылке
     *
     * @param string $url
     * @return array
     */
    public function getReviews(string $url): array
    {
        $url = escapeshellarg($url);

        $command = "\"{$this->nodePath}\" \"{$this->scriptPath}\" {$url}";

        $output = null;
        $returnVar = null;

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            return [
                'error' => 'Не удалось получить отзывы с Яндекс.Карт'
            ];
        }

        $json = implode("", $output);
        $data = json_decode($json, true);

        if (!$data) {
            return ['error' => 'Ошибка парсинга JSON'];
        }

        return $data;
    }
}
