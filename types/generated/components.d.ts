import type { Schema, Struct } from '@strapi/strapi';

export interface PefumeNotes extends Struct.ComponentSchema {
  collectionName: 'components_pefume_notes';
  info: {
    displayName: 'Notes';
  };
  attributes: {
    base: Schema.Attribute.JSON;
    middle: Schema.Attribute.JSON;
    top: Schema.Attribute.JSON;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'pefume.notes': PefumeNotes;
    }
  }
}
