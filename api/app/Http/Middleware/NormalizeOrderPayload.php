<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class NormalizeOrderPayload
{
    /**
     * Keep older clients from passing null to the order validator.
     * The order endpoint accepts its attributes under the `order` key.
     */
    public function handle(Request $request, Closure $next)
    {
        if (
            $request->isMethod('POST')
            && preg_match('#(^|/)orders/?$#', $request->path())
            && !$request->has('order')
            && is_array($request->all())
        ) {
            $request->merge(['order' => $request->all()]);
        }

        return $next($request);
    }
}
