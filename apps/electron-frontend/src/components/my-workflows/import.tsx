import { openTabPage } from '@/lib/electron-bridge';
import { track } from '@/lib/tracker';
import { readWorkflowFromFile, readWorkflowFromPng } from '@comflowy/common/comfyui-bridge/export-import';
import { documentDatabaseInstance } from '@comflowy/common/storage/document-database';
import { useAppStore } from '@comflowy/common/store';
import { message } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon } from 'ui/icons';
import {KEYS, t} from "@comflowy/common/i18n";
import { PersistedWorkflowDocument } from '@comflowy/common/types';
import { GlobalEvents, SlotGlobalEvent } from '@comflowy/common/utils/slot-event';

export const ImportWorkflow = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onFileSelected = async (file: File) => {
    try {
      const widgets = useAppStore.getState().widgets;
      let workflow: PersistedWorkflowDocument | null = null;
      if (file.type === 'image/png') {
        workflow = await readWorkflowFromPng(file, widgets);
        track('import-png-workflow');
      }

      if (file.type === 'application/json') {
        workflow = await readWorkflowFromFile(file, widgets);
        track('import-json-workflow');
      }

      if (workflow) {
        console.log("workflow: ", workflow);
        const doc = await documentDatabaseInstance.createDocFromData(workflow);
        openTabPage({
          name: doc.title,
          pageName: "app",
          query: `id=${doc.id}`,
          id: 0,
          type: "DOC"
        });
      }

    } catch(err) {
      track('import-workflow-error', {
        error: err.message,
        stack: err.stack
      });
      message.error("Unexpected error: " + err.message, 3);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'application/json')) {
      setSelectedFile(file);
      onFileSelected(file);
    } else {
      setSelectedFile(null);
      onFileSelected(null);
    }
    event.target.value = null;
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    const disposable = SlotGlobalEvent.on((ev) => {
      if (ev.type === GlobalEvents.import_workflow) {
        onFileSelected(ev.data)
      }
    })
    return () => {
      disposable.dispose();
    }
  }, [])

  return (
    <div className='create-button' onClick={handleButtonClick}>
      <div style={{ display: 'none' }}>
        <input ref={fileInputRef} type="file" accept="image/png,application/json" onChange={handleFileChange} />
      </div>
      <div className="icon">
          <ImageIcon/>
      </div>
      <div className="info">
        <div className="title">{t(KEYS.import)}</div>
        <div className="description">{t(KEYS.createFromImageOrJson)}</div>
      </div>
    </div>
  );
}
