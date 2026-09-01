<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BpeyService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.bpey.base_url', '');
        $this->apiKey = config('services.bpey.api_key', '');
    }

    /**
     * Convert a card number to an IBAN via the Bpey API.
     *
     * @throws RuntimeException
     * @throws ConnectionException
     */
    public function cardToIban(string $requestId): Response
    {
        if (empty($this->baseUrl) || empty($this->apiKey)) {
            throw new RuntimeException('Bpey service is not configured. Set BPEY_BASE_URL and BPEY_API_KEY.');
        }

        $response = Http::timeout(10)
            ->withToken($this->apiKey)
            ->acceptJson()
            ->post($this->baseUrl . '/v1/card-to-iban', [
                'request_id' => $requestId,
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'Bpey API request failed: ' . $response->status() . ' - ' . $response->body()
            );
        }

        return $response;
    }
}
