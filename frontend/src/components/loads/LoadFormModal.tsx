import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X,
  Truck,
  Building2,
  Package,
  MapPin,
  User,
  IndianRupee,
  Calendar,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { FormSection } from '@/components/shared/FormSection';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useCreateLoad } from '@/hooks/use-loads';
import { useTransportStore } from '@/stores/transport-data.store';
import { formatINR } from '@/lib/utils/currency';
import { toast } from 'sonner';

const loadItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  package_type: z.string().default('Bags'),
  quantity: z.coerce.number().min(1, 'Quantity must be > 0'),
  weight: z.coerce.number().min(0.1, 'Weight must be > 0'),
  declared_value: z.coerce.number().default(0),
  eway_bill_number: z.string().optional(),
});

const loadFormSchema = z.object({
  load_type: z.enum(['FTL', 'PTL', 'Container', 'Parcel']),
  service_type: z.enum(['Standard', 'Express', 'Dedicated']),
  customer_reference: z.string().optional(),

  // Consignor
  consignor_name: z.string().min(2, 'Consignor name required'),
  consignor_gstin: z.string().min(15, '15-digit GSTIN required').max(15),
  consignor_phone: z.string().min(10, 'Valid phone required'),
  consignor_address: z.string().min(3, 'Address required'),

  // Consignee
  consignee_name: z.string().min(2, 'Consignee name required'),
  consignee_gstin: z.string().min(15, '15-digit GSTIN required').max(15),
  consignee_phone: z.string().min(10, 'Valid phone required'),
  consignee_address: z.string().min(3, 'Address required'),

  // Corridor
  origin_city: z.string().min(2, 'Origin city required'),
  destination_city: z.string().min(2, 'Destination city required'),

  // Fleet Allocation
  vehicle_uuid: z.string().optional(),
  driver_uuid: z.string().optional(),
  odometer_start: z.coerce.number().optional(),

  // Freight & Charges
  freight_rate_type: z.enum(['per_ton', 'per_trip', 'per_kg', 'fixed']),
  base_rate: z.coerce.number().min(1, 'Base rate is required'),
  advance_amount: z.coerce.number().default(0),
  detention_per_day: z.coerce.number().default(1500),
  payment_terms: z.enum(['to_pay', 'paid', 'to_be_billed']),

  // Schedule
  pickup_datetime: z.string().min(1, 'Pickup date required'),
  delivery_datetime: z.string().min(1, 'Delivery date required'),

  // Items
  items: z.array(loadItemSchema).min(1, 'Add at least one item'),
});

type LoadFormValues = z.infer<typeof loadFormSchema>;

interface LoadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (data: any) => void;
}

export const LoadFormModal: React.FC<LoadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const createLoadMutation = useCreateLoad();
  const storeVehicles = useTransportStore((s) => s.vehicles);
  const storeDrivers = useTransportStore((s) => s.drivers);
  const addLoad = useTransportStore((s) => s.addLoad);
  const addBilty = useTransportStore((s) => s.addBilty);
  const addLrNumber = useTransportStore((s) => s.addLrNumber);

  const { data: serverVehicles } = useVehicles();
  const { data: serverDrivers } = useDrivers();
  const rawVehicles = Array.isArray(serverVehicles) ? serverVehicles : (serverVehicles as any)?.data;
  const rawDrivers = Array.isArray(serverDrivers) ? serverDrivers : (serverDrivers as any)?.data;

  const availableVehicles = storeVehicles.length > 0 ? storeVehicles : (rawVehicles || []);
  const availableDrivers = storeDrivers.length > 0 ? storeDrivers : (rawDrivers || []);

  const [activeStep, setActiveStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(loadFormSchema) as any,
    defaultValues: {
      load_type: 'FTL',
      service_type: 'Standard',
      freight_rate_type: 'per_ton',
      payment_terms: 'to_pay',
      base_rate: 2200,
      advance_amount: 10000,
      detention_per_day: 1500,
      pickup_datetime: new Date().toISOString().slice(0, 16),
      delivery_datetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      items: [
        {
          description: 'Industrial Cargo Consignment',
          package_type: 'Pallets',
          quantity: 10,
          weight: 18.5,
          declared_value: 850000,
          eway_bill_number: '281900281928',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: control as any,
    name: 'items',
  });

  const watchedBaseRate = watch('base_rate') || 0;
  const watchedAdvance = watch('advance_amount') || 0;
  const watchedItems = watch('items') || [];
  const totalWeight = watchedItems.reduce((acc: number, curr: any) => acc + (Number(curr.weight) || 0), 0);
  const totalFreight = watchedBaseRate * (totalWeight > 0 ? totalWeight : 1);
  const balancePayable = Math.max(0, totalFreight - watchedAdvance);

  if (!isOpen) return null;

  const onFormSubmit = async (values: any) => {
    try {
      const assignedPlate = values.vehicle_uuid || (availableVehicles[0]?.plate_number || 'TBD');
      const assignedDriver = values.driver_uuid || (availableDrivers[0]?.name || 'Assigned Driver');

      const payload: any = {
        load_type: values.load_type || 'FTL',
        service_type: values.service_type || 'Standard',
        customer_reference: values.customer_reference,
        consignor: {
          name: values.consignor_name,
          address: values.consignor_address,
          phone: values.consignor_phone,
          gstin: values.consignor_gstin,
        },
        consignee: {
          name: values.consignee_name,
          address: values.consignee_address,
          phone: values.consignee_phone,
          gstin: values.consignee_gstin,
        },
        origin_location: { name: values.origin_city || 'Origin Hub', address: values.consignor_address },
        destination_location: { name: values.destination_city || 'Destination Hub', address: values.consignee_address },
        vehicle: { plate_number: assignedPlate },
        driver: { name: assignedDriver, phone: values.consignor_phone || '' },
        total_freight: totalFreight,
        advance_amount: Number(values.advance_amount) || 0,
        balance_amount: balancePayable,
        eway_bill_number: values.items?.[0]?.eway_bill_number || '',
        items: values.items || [],
        status: 'pending',
      };

      const created = await createLoadMutation.mutateAsync(payload);
      onSubmitSuccess?.(created);
      onClose();
    } catch (err: any) {
      toast.error('Failed to create load. Please check inputs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-saffron-500" />
              Book New Consignment Load
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter complete consignor/consignee, goods table, fleet allocation, and freight terms.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Load Info */}
          <FormSection
            title="1. Load Classification"
            description="Type of shipment and service tier"
            icon={Truck}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Load Type *
                </label>
                <select
                  {...register('load_type')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="FTL">Full Truck Load (FTL)</option>
                  <option value="PTL">Part Truck Load (PTL)</option>
                  <option value="Container">Shipping Container</option>
                  <option value="Parcel">Express Parcel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Level *
                </label>
                <select
                  {...register('service_type')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="Standard">Standard Road Haulage</option>
                  <option value="Express">Express Priority (Non-stop)</option>
                  <option value="Dedicated">Dedicated Fleet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer PO / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-991"
                  {...register('customer_reference')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 2: Consignor & Consignee */}
          <FormSection
            title="2. Parties (Consignor & Consignee)"
            description="GST compliance details and physical addresses"
            icon={Building2}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Consignor */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Consignor (Pickup Party)
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Company / Trader Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consignor Enterprise Pvt Ltd"
                    {...register('consignor_name')}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                  {errors.consignor_name && (
                    <p className="text-[10px] text-red-500 mt-0.5">{String(errors.consignor_name?.message || '')}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      GSTIN (15-digit) *
                    </label>
                    <input
                      type="text"
                      placeholder="27AABCU9603R1ZM"
                      {...register('consignor_gstin')}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-mono uppercase text-slate-900 dark:text-white"
                    />
                    {errors.consignor_gstin && (
                      <p className="text-[10px] text-red-500 mt-0.5">{String(errors.consignor_gstin?.message || '')}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Contact Mobile *
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98200 11223"
                      {...register('consignor_phone')}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Pickup Address & Godown *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Pickup Facility / Warehouse Address"
                    {...register('consignor_address')}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Consignee */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                  Consignee (Delivery Party)
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Company / Receiver Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consignee Enterprise / Factory"
                    {...register('consignee_name')}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                  {errors.consignee_name && (
                    <p className="text-[10px] text-red-500 mt-0.5">{String(errors.consignee_name?.message || '')}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      GSTIN (15-digit) *
                    </label>
                    <input
                      type="text"
                      placeholder="24AAACJ1203Q1Z8"
                      {...register('consignee_gstin')}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-mono uppercase text-slate-900 dark:text-white"
                    />
                    {errors.consignee_gstin && (
                      <p className="text-[10px] text-red-500 mt-0.5">{String(errors.consignee_gstin?.message || '')}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Contact Mobile *
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98110 33445"
                      {...register('consignee_phone')}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Delivery Address & Unloading Point *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Survey 120, GIDC Industrial Estate, Vadodara, Gujarat - 390010"
                    {...register('consignee_address')}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          {/* Section 3: Material Details & E-Way Bill Table */}
          <FormSection
            title="3. Goods / Cargo Manifest & E-Way Bill"
            description="Dynamic material rows with packaging, weight (MT), and GST e-Way bills"
            icon={Package}
          >
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Package</th>
                      <th className="py-2.5 px-3 w-20">Qty</th>
                      <th className="py-2.5 px-3 w-24">Weight (MT)</th>
                      <th className="py-2.5 px-3 w-28">Value (₹)</th>
                      <th className="py-2.5 px-3">E-Way Bill #</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fields.map((field, idx) => (
                      <tr key={field.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. Steel Coils"
                            {...register(`items.${idx}.description` as const)}
                            className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            {...register(`items.${idx}.package_type` as const)}
                            className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5"
                          >
                            <option value="Bags">Bags</option>
                            <option value="Boxes">Boxes</option>
                            <option value="Drums">Drums</option>
                            <option value="Pallets">Pallets</option>
                            <option value="Loose/Bulk">Loose/Bulk</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            {...register(`items.${idx}.quantity` as const)}
                            className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 font-mono text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${idx}.weight` as const)}
                            className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 font-mono text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            {...register(`items.${idx}.declared_value` as const)}
                            className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 font-mono text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="12-digit E-Way"
                            {...register(`items.${idx}.eway_bill_number` as const)}
                            className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    append({
                      description: '',
                      package_type: 'Boxes',
                      quantity: 1,
                      weight: 1,
                      declared_value: 0,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Cargo Row
                </button>

                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-4">
                  <span>Total Weight: <strong className="font-mono text-navy-800 dark:text-navy-200">{totalWeight.toFixed(2)} MT</strong></span>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Section 4: Route Corridor & Locations */}
          <FormSection
            title="4. Transport Corridor & Stops"
            description="Origin and destination city hubs"
            icon={MapPin}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Origin City / Hub *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai JNPT"
                  {...register('origin_city')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination City / Hub *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad GIDC"
                  {...register('destination_city')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 5: Vehicle & Driver Allocation */}
          <FormSection
            title="5. Vehicle & Driver Assignment"
            description="Assign available truck and licensed driver"
            icon={User}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Truck (Plate)
                </label>
                <select
                  {...register('vehicle_uuid')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Available Truck --</option>
                  {availableVehicles.map((v: any) => (
                    <option key={v.id || v.plate_number} value={v.plate_number}>
                      {v.plate_number} ({v.make || 'Truck'} - {v.capacity_tonnage || 25}T)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Driver
                </label>
                <select
                  {...register('driver_uuid')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Available Driver --</option>
                  {availableDrivers.map((d: any) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name} ({d.phone || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Odometer Start (KM)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 142850"
                  {...register('odometer_start')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 6: Freight & Billing Terms */}
          <FormSection
            title="6. Freight Pricing & Payment Terms"
            description="Freight calculation, advances, and payment terms"
            icon={IndianRupee}
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Freight Rate Type
                </label>
                <select
                  {...register('freight_rate_type')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="per_ton">Per Ton (₹/MT)</option>
                  <option value="per_trip">Fixed Per Trip</option>
                  <option value="per_kg">Per Kg</option>
                  <option value="fixed">Lump-sum Fixed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Base Rate (₹) *
                </label>
                <input
                  type="number"
                  {...register('base_rate')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Amount Paid (₹)
                </label>
                <input
                  type="number"
                  {...register('advance_amount')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Terms *
                </label>
                <select
                  {...register('payment_terms')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="to_pay">To Pay (Receiver pays)</option>
                  <option value="paid">Paid (Sender prepaid)</option>
                  <option value="to_be_billed">To Be Billed (Credit Account)</option>
                </select>
              </div>
            </div>

            {/* Calculated Financial Summary Box */}
            <div className="p-3 rounded-lg bg-navy-50/70 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-900 flex flex-wrap items-center justify-between text-xs mt-3">
              <div>
                <span className="text-slate-500">Estimated Total Freight:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white ml-1.5 text-sm">
                  {formatINR(totalFreight)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Advance Paid:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-1.5">
                  {formatINR(watchedAdvance)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Balance at Delivery:</span>
                <span className="font-mono font-bold text-saffron-600 dark:text-saffron-400 ml-1.5 text-sm">
                  {formatINR(balancePayable)}
                </span>
              </div>
            </div>
          </FormSection>

          {/* Section 7: Schedule */}
          <FormSection
            title="7. Dispatch & Delivery Schedule"
            description="Pickup appointment and delivery commitment"
            icon={Calendar}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scheduled Pickup Date & Time *
                </label>
                <input
                  type="datetime-local"
                  {...register('pickup_datetime')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Delivery Date & Time *
                </label>
                <input
                  type="datetime-local"
                  {...register('delivery_datetime')}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </FormSection>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-saffron-500 hover:bg-saffron-600 active:scale-95 rounded-lg shadow-md shadow-saffron-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Create & Dispatch Consignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
