<?php

namespace Tests\Unit;

use App\Http\Middleware\NormalizeOrderPayload;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class NormalizeOrderPayloadTest extends TestCase
{
    public function test_flat_order_input_is_wrapped(): void
    {
        $request = Request::create('/int/v1/orders', 'POST', ['load_number' => 'LD-1']);

        (new NormalizeOrderPayload())->handle($request, static fn (Request $request) => $request);

        $this->assertSame(['load_number' => 'LD-1'], $request->input('order'));
    }

    public function test_existing_order_input_is_not_overwritten(): void
    {
        $request = Request::create('/int/v1/orders', 'POST', [
            'order' => ['order_config_uuid' => 'config-1'],
            'load_number' => 'LD-1',
        ]);

        (new NormalizeOrderPayload())->handle($request, static fn (Request $request) => $request);

        $this->assertSame(['order_config_uuid' => 'config-1'], $request->input('order'));
    }
}
