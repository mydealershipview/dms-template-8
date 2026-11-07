import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { isAdmin, isAdminFieldLevel } from '@/access/isAdmin'

export const Listings: CollectionConfig = {
  slug: 'listings',
  dbName: 'vehicle_listings',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    hidden: true,
    description: 'Legacy stock backup only. Live stock, price and highlight are owned by DMS.',
    defaultColumns: ['vehicle.make', 'vehicle.model', 'vehicle.yearOfManufacture', 'adverts.forecourtPrice.amountGBP', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'MAKE - MODEL - YEAR',
      }
    },
    // Vehicle object - matches AutoTrader structure exactly
    {
      name: 'vehicle',
      type: 'group',
      access: {
        update: isAdminFieldLevel,
        read: isAdminFieldLevel
      },
      fields: [
        {
          name: 'ownershipCondition',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'registration',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'vin',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'make',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'model',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'generation',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'derivative',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'derivativeId',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'vehicleType',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'trim',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'bodyType',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'fuelType',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'transmissionType',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'drivetrain',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'seats',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'doors',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'cylinders',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'co2EmissionGPKM',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'topSpeedMPH',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'zeroToSixtyMPHSeconds',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'badgeEngineSizeLitres',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'engineCapacityCC',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'enginePowerBHP',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'fuelCapacityLitres',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'emissionClass',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'owners',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'fuelEconomyNEDCCombinedMPG',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'fuelEconomyWLTPCombinedMPG',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'bootSpaceSeatsUpLitres',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'insuranceGroup',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'firstRegistrationDate',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'colour',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'style',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'odometerReadingMiles',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'motExpiryDate',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'warrantyMonthsOnPurchase',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'serviceHistory',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'plate',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'yearOfManufacture',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        // Standard object
        {
          name: 'standard',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'make',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'model',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'generation',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'derivative',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'trim',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'bodyType',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'fuelType',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'transmissionType',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'colour',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'style',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
      ]
    },

    // Advertiser object - matches AutoTrader structure exactly
    {
      name: 'advertiser',
      type: 'group',
      access: {
        update: isAdminFieldLevel,
        read: isAdminFieldLevel
      },
      fields: [
        {
          name: 'advertiserId',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'name',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'segment',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'website',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'phone',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'location',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'addressLineOne',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'town',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'county',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'region',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'postCode',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'latitude',
              type: 'number',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'longitude',
              type: 'number',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
      ]
    },

    // Adverts object - matches AutoTrader structure exactly
    {
      name: 'adverts',
      type: 'group',
      fields: [
        {
          name: 'forecourtPrice',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'amountGBP',
              type: 'number',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
        {
          name: 'soldPrice',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'amountGBP',
              type: 'number',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
        {
          name: 'forecourtPriceVatStatus',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'vatScheme',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'dueDate',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'manufacturerApproved',
          type: 'checkbox',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'twelveMonthsMot',
          type: 'checkbox',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'motInsurance',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'reservationStatus',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'retailAdverts',
          type: 'group',
          fields: [
            {
              name: 'priceOnApplication',
              type: 'checkbox',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'suppliedPrice',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'amountGBP',
                  type: 'number',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'amountGBX',
                  type: 'number',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'totalPrice',
              type: 'group',
              access: {
                read: () => true,
                update: () => true,
              },
              fields: [
                {
                  name: 'amountGBP',
                  type: 'number',
                  access: {
                    read: () => true,
                    update: () => true,
                  },
                },
              ]
            },
            {
              name: 'reservePrice',
              type: 'number',
              defaultValue: 99,
              access: {
                read: () => true,
                update: () => true,
              }
            },
            {
              name: 'adminFee',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'amountGBP',
                  type: 'number',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'adminFeeOverride',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'amountGBP',
                  type: 'number',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'manufacturerRRP',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'amountGBP',
                  type: 'number',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'vatStatus',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'attentionGrabber',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'description',
              type: 'textarea',
              access: {
                read: () => true,
                update: () => true,
              }
            },
            {
              name: 'description2',
              type: 'textarea',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'priceIndicatorRating',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'priceIndicatorRatingBands',
              type: 'json',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'autotraderAdvert',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'eligibleContractAllowances',
                  type: 'array',
                  dbName: 'autotrader_eligible_allowances',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                  fields: [
                    {
                      name: 'type',
                      type: 'text',
                    },
                  ]
                },
                {
                  name: 'allocatedContractAllowance',
                  type: 'group',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                  fields: [
                    {
                      name: 'type',
                      type: 'text',
                      access: {
                        update: isAdminFieldLevel,
                        read: isAdminFieldLevel
                      },
                    },
                  ]
                },
              ]
            },
            {
              name: 'advertiserAdvert',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'locatorAdvert',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'exportAdvert',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'profileAdvert',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'displayOptions',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'excludePreviousOwners',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'excludeStrapline',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'excludeMot',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'excludeWarranty',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'excludeInteriorDetails',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'excludeTyreCondition',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
                {
                  name: 'excludeBodyCondition',
                  type: 'checkbox',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
            {
              name: 'financeOffers',
              type: 'json',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
        {
          name: 'tradeAdverts',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'dealerAuctionAdvert',
              type: 'group',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                  access: {
                    update: isAdminFieldLevel,
                    read: isAdminFieldLevel
                  },
                },
              ]
            },
          ]
        },
      ]
    },

    // Metadata object - matches AutoTrader structure exactly
    {
      name: 'metadata',
      type: 'group',
      access: {
        update: isAdminFieldLevel,
        read: isAdminFieldLevel
      },
      fields: [
        {
          name: 'stockId',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'searchId',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'externalStockId',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'lastUpdated',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'versionNumber',
          type: 'number',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'lifecycleState',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'dateOnForecourt',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
      ]
    },

    // Features array - matches AutoTrader structure exactly
    {
      name: 'features',
      type: 'array',
      dbName: 'vehicle_features',
      access: {
        update: isAdminFieldLevel,
        read: isAdminFieldLevel
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'type',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'standardName',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'category',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'rarityRating',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
        {
          name: 'valueRating',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
      ]
    },

    // Highlights array - matches AutoTrader structure exactly
    {
      name: 'highlights',
      type: 'array',
      dbName: 'vehicle_highlights',
      access: {
        update: isAdminFieldLevel,
        read: isAdminFieldLevel
      },
      fields: [
        {
          name: 'highlight',
          type: 'text',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
        },
      ]
    },

    // Media object - matches AutoTrader structure exactly
    {
      name: 'media',
      type: 'group',
      access: {
        update: isAdminFieldLevel,
        read: isAdminFieldLevel
      },
      fields: [
        {
          name: 'images',
          type: 'array',
          dbName: 'media_images',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'href',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
            {
              name: 'templated',
              type: 'checkbox',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
        {
          name: 'video',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'href',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
        {
          name: 'spin',
          type: 'group',
          access: {
            update: isAdminFieldLevel,
            read: isAdminFieldLevel
          },
          fields: [
            {
              name: 'href',
              type: 'text',
              access: {
                update: isAdminFieldLevel,
                read: isAdminFieldLevel
              },
            },
          ]
        },
      ]
    },
  ],
}
