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

        $this->scriptPath = base_path('external-scripts/yandex_reviews.js');
    }

    /**
     *
     * @param string $url
     * @return array
     */
    public function getReviews(string $url): array
    {
        $url = escapeshellarg($url);

        // 2>&1 чтобы stderr шёл в $output
        $command = 'HOME=/var/www/chrome-data "' . $this->nodePath . '" "' . $this->scriptPath . '" ' . $url . ' 2>&1';

//        $command = "\"{$this->nodePath}\" \"{$this->scriptPath}\" {$url} 2>&1";

        $output = [];
        $returnVar = null;

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            return [
                'error' => 'Не удалось получить отзывы с Яндекс.Карт',
                'return_code' => $returnVar,
                'output' => $output
            ];
        }

        $json = implode("\n", $output);
        $data = json_decode($json, true);

        if (!$data) {
            return [
                'error' => 'Ошибка парсинга JSON',
                'raw_output' => $json
            ];
        }

        return $data;
    }
}
