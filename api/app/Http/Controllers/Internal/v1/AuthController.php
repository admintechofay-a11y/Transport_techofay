<?php

namespace App\Http\Controllers\Internal\v1;

use App\Http\Controllers\Controller;
use Fleetbase\Models\Company;
use Fleetbase\Models\User;
use Fleetbase\Support\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Authenticate operator or dispatcher.
     */
    public function login(Request $request)
    {
        $identity = trim((string) ($request->input('identity') ?? $request->input('email') ?? $request->input('username') ?? ''));
        $password = (string) ($request->input('password') ?? '');

        if (empty($identity) || empty($password)) {
            return response()->json([
                'message' => 'Please provide both email/phone and password.',
                'errors' => ['identity' => ['Identity and password are required.']]
            ], 422);
        }

        // Special handling for default Demo Admin if not yet in DB
        if (strtolower($identity) === 'dispatch.admin@techofay.com' && $password === 'fleet2026') {
            $user = User::where('email', 'dispatch.admin@techofay.com')->first();
            if (!$user) {
                $user = User::create([
                    'name' => 'Dispatch Officer',
                    'email' => 'dispatch.admin@techofay.com',
                    'password' => 'fleet2026',
                    'type' => 'admin',
                    'status' => 'active',
                ]);
            }
            $company = Company::where('uuid', 'company_techofay_01')->first();
            if (!$company) {
                $company = Company::create([
                    'uuid' => 'company_techofay_01',
                    'name' => 'TECHOFAY GLOBAL VENTURES',
                    'currency' => 'INR',
                    'country' => 'IN',
                    'status' => 'active',
                ]);
            }
            if ($user->company_uuid !== $company->uuid) {
                $user->company_uuid = $company->uuid;
                $user->save();
            }

            $token = $user->createToken($user->uuid)->plainTextToken;

            return response()->json([
                'token' => $token,
                'type' => 'admin',
                'user' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '+91 93593 39000',
                    'role' => 'Administrator',
                ],
                'company' => [
                    'id' => $company->id,
                    'uuid' => $company->uuid,
                    'name' => $company->name,
                    'currency' => 'INR',
                ],
            ]);
        }

        // Find user by email or phone
        $user = User::where(function ($q) use ($identity) {
            $q->where('email', strtolower($identity))
              ->orWhere('phone', $identity)
              ->orWhere('username', $identity);
        })->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'message' => 'These credentials do not match our records. Please verify email and password.',
            ], 401);
        }

        // Update login timestamp
        $user->updateLastLogin();
        $token = $user->createToken($user->uuid)->plainTextToken;

        // Fetch company
        $company = null;
        if ($user->company_uuid) {
            $company = Company::where('uuid', $user->company_uuid)->first();
        }
        if (!$company) {
            $company = Company::first();
        }

        return response()->json([
            'token' => $token,
            'type' => $user->type ?? 'admin',
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->type === 'admin' ? 'Administrator' : ($user->type ?? 'dispatcher'),
            ],
            'company' => [
                'id' => $company->id ?? null,
                'uuid' => $company->uuid ?? 'company_techofay_01',
                'name' => $company->name ?? 'TECHOFAY GLOBAL VENTURES',
                'currency' => $company->currency ?? 'INR',
            ],
        ]);
    }

    /**
     * Register new transporter or dispatcher account.
     */
    public function signUp(Request $request)
    {
        // Extract fields whether flat or nested
        $name = $request->input('name') 
            ?? $request->input('user.name') 
            ?? 'Transport Manager';

        $email = strtolower(trim((string) (
            $request->input('email') 
            ?? $request->input('user.email') 
            ?? ''
        )));

        $password = (string) (
            $request->input('password') 
            ?? $request->input('user.password') 
            ?? ''
        );

        $phone = $request->input('phone') 
            ?? $request->input('user.phone') 
            ?? null;

        $companyName = $request->input('company_name') 
            ?? $request->input('company.name') 
            ?? 'Techofay Global Logistics';

        if (empty($email)) {
            return response()->json([
                'message' => 'Please provide a valid email address.',
                'errors' => ['email' => ['The email field is required.']]
            ], 422);
        }

        if (empty($password) || strlen($password) < 4) {
            return response()->json([
                'message' => 'Password must be at least 4 characters.',
                'errors' => ['password' => ['Password must be at least 4 characters.']]
            ], 422);
        }

        // Check if user already exists
        $existing = User::where('email', $email)->first();
        if ($existing) {
            if (Hash::check($password, $existing->password)) {
                // Password matches, log user in
                $token = $existing->createToken($existing->uuid)->plainTextToken;
                $company = Company::where('uuid', $existing->company_uuid)->first() ?? Company::first();

                return response()->json([
                    'token' => $token,
                    'type' => $existing->type ?? 'admin',
                    'user' => [
                        'id' => $existing->id,
                        'uuid' => $existing->uuid,
                        'name' => $existing->name,
                        'email' => $existing->email,
                        'phone' => $existing->phone,
                        'role' => 'Administrator',
                    ],
                    'company' => [
                        'id' => $company->id ?? null,
                        'uuid' => $company->uuid ?? 'company_techofay_01',
                        'name' => $company->name ?? $companyName,
                        'currency' => 'INR',
                    ],
                ]);
            }

            return response()->json([
                'message' => 'An account with this email address already exists. Please sign in.',
                'errors' => ['email' => ['An account with this email address already exists.']]
            ], 400);
        }

        try {
            // Register user and company via Fleetbase Auth
            $newUser = Auth::register([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'type' => 'admin',
                'status' => 'active',
            ], [
                'name' => $companyName,
                'currency' => 'INR',
                'country' => 'IN',
                'phone' => $phone,
                'email' => $email,
                'status' => 'active',
            ]);

            // Set password and type explicitly because password is guarded in User model
            $newUser->password = $password;
            $newUser->type = 'admin';
            $newUser->save();

            $token = $newUser->createToken($newUser->uuid)->plainTextToken;
            $company = Company::where('uuid', $newUser->company_uuid)->first();

            return response()->json([
                'token' => $token,
                'type' => 'admin',
                'user' => [
                    'id' => $newUser->id,
                    'uuid' => $newUser->uuid,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'phone' => $newUser->phone,
                    'role' => 'Administrator',
                ],
                'company' => [
                    'id' => $company->id ?? null,
                    'uuid' => $company->uuid ?? 'company_techofay_01',
                    'name' => $company->name ?? $companyName,
                    'currency' => 'INR',
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Registration could not be completed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Session validation.
     */
    public function session(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            $bearer = $request->bearerToken();
            if ($bearer) {
                $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($bearer);
                if ($tokenModel && $tokenModel->tokenable) {
                    $user = $tokenModel->tokenable;
                }
            }
        }

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $company = Company::where('uuid', $user->company_uuid)->first() ?? Company::first();

        return response()->json([
            'token' => $request->bearerToken(),
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'role' => $user->type === 'admin' ? 'Administrator' : ($user->type ?? 'dispatcher'),
            ],
            'company' => [
                'id' => $company->id ?? null,
                'uuid' => $company->uuid ?? 'company_techofay_01',
                'name' => $company->name ?? 'TECHOFAY GLOBAL VENTURES',
                'currency' => $company->currency ?? 'INR',
            ],
            'verified' => true,
        ]);
    }
}
