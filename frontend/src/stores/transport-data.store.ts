import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Vehicle } from '@/types/vehicle.types';
import { Driver } from '@/types/driver.types';
import { CustomerParty } from '@/types/customer.types';
import { Load } from '@/types/load.types';
import { Bilty } from '@/types/bilty.types';
import { LrNumber } from '@/types/lr-number.types';
import { DeliveryChallan, GatePass } from '@/types/delivery-challan.types';

export interface TransportDataState {
  // Collections
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: CustomerParty[];
  loads: Load[];
  bilties: Bilty[];
  lrNumbers: LrNumber[];
  deliveryChallans: DeliveryChallan[];
  gatePasses: GatePass[];

  // Vehicle Actions
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string | number, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string | number) => void;

  // Driver Actions
  addDriver: (driver: Driver) => void;
  updateDriver: (id: string | number, updates: Partial<Driver>) => void;
  deleteDriver: (id: string | number) => void;

  // Customer Party Actions
  addCustomer: (customer: CustomerParty) => void;
  updateCustomer: (id: string, updates: Partial<CustomerParty>) => void;
  deleteCustomer: (id: string) => void;

  // Load (Lorry Consignment) Actions
  addLoad: (load: Load) => void;
  updateLoad: (id: string, updates: Partial<Load>) => void;
  updateLoadStatus: (id: string, status: string) => void;
  deleteLoad: (id: string) => void;

  // Bilty Actions
  addBilty: (bilty: Bilty) => void;
  updateBilty: (id: string, updates: Partial<Bilty>) => void;
  deleteBilty: (id: string) => void;

  // LR Number Actions
  addLrNumber: (lr: LrNumber) => void;
  updateLrNumber: (id: string, updates: Partial<LrNumber>) => void;
  deleteLrNumber: (id: string) => void;

  // Delivery Challan Actions
  addDeliveryChallan: (challan: DeliveryChallan) => void;
  updateDeliveryChallan: (id: string, updates: Partial<DeliveryChallan>) => void;
  deleteDeliveryChallan: (id: string) => void;

  // Gate Pass Actions
  addGatePass: (gatePass: GatePass) => void;
  updateGatePass: (id: string, updates: Partial<GatePass>) => void;
  deleteGatePass: (id: string) => void;

  // Financial & Operational Settlement Workflows
  recordFreightPayment: (
    loadIdOrNumber: string,
    amountReceived: number,
    paymentMode?: string,
    referenceNumber?: string
  ) => void;

  uploadPod: (
    loadIdOrNumber: string,
    podData: {
      receiverName: string;
      receiverPhone?: string;
      deliveryDate?: string;
      remarks?: string;
      fileUrl?: string;
    }
  ) => void;

  // Bulk / Reset
  clearAll: () => void;
  seedProductionDemoData: () => void;
}

export const useTransportStore = create<TransportDataState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      drivers: [],
      customers: [],
      loads: [],
      bilties: [],
      lrNumbers: [],
      deliveryChallans: [],
      gatePasses: [],

      // Vehicle handlers
      addVehicle: (vehicle) => {
        set((state) => ({
          vehicles: [
            vehicle,
            ...state.vehicles.filter((v) => (v.id || v.plate_number) !== (vehicle.id || vehicle.plate_number)),
          ],
        }));
      },
      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            (v.id === id || v.plate_number === id) ? { ...v, ...updates, updated_at: new Date().toISOString() } : v
          ),
        }));
      },
      deleteVehicle: (id) => {
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id && v.plate_number !== id),
        }));
      },

      // Driver handlers
      addDriver: (driver) => {
        set((state) => ({
          drivers: [
            driver,
            ...state.drivers.filter((d) => (d.id || d.phone) !== (driver.id || driver.phone)),
          ],
        }));
      },
      updateDriver: (id, updates) => {
        set((state) => ({
          drivers: state.drivers.map((d) =>
            (d.id === id || d.phone === id) ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
          ),
        }));
      },
      deleteDriver: (id) => {
        set((state) => ({
          drivers: state.drivers.filter((d) => d.id !== id && d.phone !== id),
        }));
      },

      // Customer handlers
      addCustomer: (customer) => {
        set((state) => ({
          customers: [
            customer,
            ...state.customers.filter((c) => c.id !== customer.id && c.name !== customer.name),
          ],
        }));
      },
      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      // Load handlers
      addLoad: (load) => {
        set((state) => {
          const updatedLoads = [
            load,
            ...state.loads.filter((l) => (l.id || l.load_number) !== (load.id || load.load_number)),
          ];
          try {
            localStorage.setItem('techofay_registered_loads', JSON.stringify(updatedLoads));
          } catch {
            // ignore
          }

          // Mark vehicle as on_trip
          let updatedVehicles = state.vehicles;
          if (load.vehicle?.plate_number) {
            updatedVehicles = state.vehicles.map((v) =>
              v.plate_number === load.vehicle?.plate_number
                ? {
                    ...v,
                    status: 'on_trip',
                    current_trip_corridor: `${load.origin_location?.name || ''} → ${load.destination_location?.name || ''}`,
                  }
                : v
            );
          }

          // Mark driver as on_trip
          let updatedDrivers = state.drivers;
          if (load.driver?.name) {
            updatedDrivers = state.drivers.map((d) =>
              d.name === load.driver?.name
                ? {
                    ...d,
                    status: 'on_trip',
                    current_corridor: `${load.origin_location?.name || ''} → ${load.destination_location?.name || ''}`,
                  }
                : d
            );
          }

          // Auto-generate matching Delivery Challan
          const randomSeq = Math.floor(1000 + Math.random() * 9000);
          const rawNum = String(load.load_number || randomSeq).replace(/[^0-9]/g, '');
          const cleanSuffix = rawNum.slice(-4) || String(randomSeq);
          const autoChallan: DeliveryChallan = {
            uuid: `dc_${Date.now()}`,
            public_id: `dc_${Date.now()}`,
            challan_number: `DC-${new Date().getFullYear()}-${cleanSuffix}`,
            challan_date: load.created_at ? load.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            status: 'pending',
            order: { load_number: load.load_number },
            consignee: {
              name: load.consignee?.name || 'Consignee',
              phone: load.consignee?.phone,
              delivery_address: load.destination_location?.name || load.consignee?.address,
            },
            vehicle: { plate_number: load.vehicle?.plate_number || 'TBD' },
            driver: { name: load.driver?.name || 'Driver', phone: load.driver?.phone },
            total_weight: Number((load as any).weight_mt || 25),
            total_quantity: Number((load as any).quantity || 1),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Auto-generate Outward Gate Pass
          const autoGatePass: GatePass = {
            uuid: `gp_${Date.now()}`,
            public_id: `gp_${Date.now()}`,
            gate_pass_number: `GP-${new Date().getFullYear()}-${cleanSuffix}`,
            pass_type: 'out',
            in_time: new Date().toISOString(),
            out_time: new Date().toISOString(),
            authorized_by: 'Fleet Terminal Security',
            security_name: 'Inspector R. Sharma',
            order: { load_number: load.load_number },
            vehicle: { plate_number: load.vehicle?.plate_number || 'TBD' },
            driver: { name: load.driver?.name || 'Driver' },
            remarks: `Consignment cargo dispatch to ${load.destination_location?.name || 'Destination'}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          return {
            loads: updatedLoads,
            vehicles: updatedVehicles,
            drivers: updatedDrivers,
            deliveryChallans: [autoChallan, ...state.deliveryChallans],
            gatePasses: [autoGatePass, ...state.gatePasses],
          };
        });
      },
      updateLoad: (id, updates) => {
        set((state) => {
          const updatedLoads = state.loads.map((l) =>
            (l.id === id || l.load_number === id) ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
          );
          try {
            localStorage.setItem('techofay_registered_loads', JSON.stringify(updatedLoads));
          } catch {
            // ignore
          }
          return { loads: updatedLoads };
        });
      },
      updateLoadStatus: (id, status) => {
        set((state) => {
          const updatedLoads = state.loads.map((l) =>
            (l.id === id || l.load_number === id) ? { ...l, status, updated_at: new Date().toISOString() } : l
          );
          try {
            localStorage.setItem('techofay_registered_loads', JSON.stringify(updatedLoads));
          } catch {
            // ignore
          }
          return { loads: updatedLoads };
        });
      },
      deleteLoad: (id) => {
        set((state) => {
          const updatedLoads = state.loads.filter((l) => l.id !== id && l.load_number !== id);
          try {
            localStorage.setItem('techofay_registered_loads', JSON.stringify(updatedLoads));
          } catch {
            // ignore
          }
          return { loads: updatedLoads };
        });
      },

      // Bilty handlers
      addBilty: (bilty) => {
        set((state) => {
          const updatedBilties = [
            bilty,
            ...state.bilties.filter((b) => (b.id || b.bilty_number) !== (bilty.id || bilty.bilty_number)),
          ];
          try {
            localStorage.setItem('techofay_registered_bilties', JSON.stringify(updatedBilties));
          } catch {
            // ignore
          }
          return { bilties: updatedBilties };
        });
      },
      updateBilty: (id, updates) => {
        set((state) => {
          const updatedBilties = state.bilties.map((b) =>
            (b.id === id || b.bilty_number === id) ? { ...b, ...updates } : b
          );
          try {
            localStorage.setItem('techofay_registered_bilties', JSON.stringify(updatedBilties));
          } catch {
            // ignore
          }
          return { bilties: updatedBilties };
        });
      },
      deleteBilty: (id) => {
        set((state) => {
          const updatedBilties = state.bilties.filter((b) => b.id !== id && b.bilty_number !== id);
          try {
            localStorage.setItem('techofay_registered_bilties', JSON.stringify(updatedBilties));
          } catch {
            // ignore
          }
          return { bilties: updatedBilties };
        });
      },

      // LR Number handlers
      addLrNumber: (lr) => {
        set((state) => ({
          lrNumbers: [
            lr,
            ...state.lrNumbers.filter((l) => (l.id || l.lr_number) !== (lr.id || lr.lr_number)),
          ],
        }));
      },
      updateLrNumber: (id, updates) => {
        set((state) => ({
          lrNumbers: state.lrNumbers.map((l) =>
            (l.id === id || l.lr_number === id) ? { ...l, ...updates } : l
          ),
        }));
      },
      deleteLrNumber: (id) => {
        set((state) => ({
          lrNumbers: state.lrNumbers.filter((l) => l.id !== id && l.lr_number !== id),
        }));
      },

      // Delivery Challan handlers
      addDeliveryChallan: (challan) => {
        set((state) => ({
          deliveryChallans: [
            challan,
            ...state.deliveryChallans.filter((c) => (c.uuid || c.challan_number) !== (challan.uuid || challan.challan_number)),
          ],
        }));
      },
      updateDeliveryChallan: (id, updates) => {
        set((state) => ({
          deliveryChallans: state.deliveryChallans.map((c) =>
            (c.uuid === id || c.challan_number === id) ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
        }));
      },
      deleteDeliveryChallan: (id) => {
        set((state) => ({
          deliveryChallans: state.deliveryChallans.filter((c) => c.uuid !== id && c.challan_number !== id),
        }));
      },

      // Gate Pass handlers
      addGatePass: (gatePass) => {
        set((state) => ({
          gatePasses: [
            gatePass,
            ...state.gatePasses.filter((g) => (g.uuid || g.gate_pass_number) !== (gatePass.uuid || gatePass.gate_pass_number)),
          ],
        }));
      },
      updateGatePass: (id, updates) => {
        set((state) => ({
          gatePasses: state.gatePasses.map((g) =>
            (g.uuid === id || g.gate_pass_number === id) ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
          ),
        }));
      },
      deleteGatePass: (id) => {
        set((state) => ({
          gatePasses: state.gatePasses.filter((g) => g.uuid !== id && g.gate_pass_number !== id),
        }));
      },

      // Payment Settlement
      recordFreightPayment: (loadIdOrNumber, amountReceived, paymentMode = 'Bank Transfer', referenceNumber = '') => {
        set((state) => {
          const load = state.loads.find((l) => l.id === loadIdOrNumber || l.load_number === loadIdOrNumber);
          if (!load) return state;

          const currentAdv = Number(load.advance_amount || 0);
          const totalFreight = Number(load.total_freight || 0);
          const newAdvance = currentAdv + Number(amountReceived);
          const newBalance = Math.max(0, totalFreight - newAdvance);

          const updatedLoads = state.loads.map((l) =>
            (l.id === load.id || l.load_number === load.load_number)
              ? {
                  ...l,
                  advance_amount: newAdvance,
                  balance_amount: newBalance,
                  status: newBalance === 0 ? 'completed' : l.status,
                  updated_at: new Date().toISOString(),
                }
              : l
          );

          // Update matching bilty
          const updatedBilties = state.bilties.map((b) =>
            (b.lr_number?.includes(load.load_number || '') || b.consignor_name === load.consignor?.name)
              ? {
                  ...b,
                  advance_amount: newAdvance,
                  balance_amount: newBalance,
                }
              : b
          );

          // Update customer ledger
          const customerName = load.consignor?.name;
          const updatedCustomers = state.customers.map((c) => {
            if (customerName && c.name.toLowerCase() === customerName.toLowerCase()) {
              const currentPaid = Number(c.total_paid || 0);
              const currentBal = Number(c.outstanding_balance || 0);
              return {
                ...c,
                total_paid: currentPaid + Number(amountReceived),
                outstanding_balance: Math.max(0, currentBal - Number(amountReceived)),
              };
            }
            return c;
          });

          return {
            loads: updatedLoads,
            bilties: updatedBilties,
            customers: updatedCustomers,
          };
        });
      },

      // POD Upload & Verification
      uploadPod: (loadIdOrNumber, podData) => {
        set((state) => {
          const updatedLoads = state.loads.map((l) => {
            if (l.id === loadIdOrNumber || l.load_number === loadIdOrNumber) {
              return {
                ...l,
                status: 'delivered',
                pod_status: 'verified',
                pod_received_by: podData.receiverName,
                pod_receiver_phone: podData.receiverPhone,
                pod_delivery_date: podData.deliveryDate || new Date().toISOString(),
                pod_remarks: podData.remarks,
                pod_url: podData.fileUrl || '/pod-sample-stamp.png',
                updated_at: new Date().toISOString(),
              };
            }
            return l;
          });

          const updatedChallans = state.deliveryChallans.map((c) => {
            if (c.order?.load_number === loadIdOrNumber || c.challan_number === loadIdOrNumber) {
              return {
                ...c,
                status: 'delivered' as const,
                received_by: podData.receiverName,
                delivered_at: podData.deliveryDate || new Date().toISOString(),
                remarks: podData.remarks,
              };
            }
            return c;
          });

          const updatedBilties = state.bilties.map((b) => {
            if (b.bilty_number === loadIdOrNumber || b.lr_number?.includes(loadIdOrNumber)) {
              return {
                ...b,
                status: 'delivered' as const,
              };
            }
            return b;
          });

          return {
            loads: updatedLoads,
            deliveryChallans: updatedChallans,
            bilties: updatedBilties,
          };
        });
      },

      clearAll: () => {
        set({
          vehicles: [],
          drivers: [],
          customers: [],
          loads: [],
          bilties: [],
          lrNumbers: [],
          deliveryChallans: [],
          gatePasses: [],
        });
        localStorage.removeItem('techofay_transport_store_v1');
        localStorage.removeItem('techofay_transport_store_v2');
        localStorage.removeItem('techofay_registered_loads');
        localStorage.removeItem('techofay_registered_bilties');
      },

      seedProductionDemoData: () => {
        // Production clean state
      },
    }),
    {
      name: 'techofay_transport_store_v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
