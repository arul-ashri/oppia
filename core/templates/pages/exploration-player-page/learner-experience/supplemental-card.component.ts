// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the supplemental card.
 */

import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { StateCard } from 'domain/state_card/state-card.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { AudioPlayerService } from 'services/audio-player.service';
import { AutogeneratedAudioPlayerService } from 'services/autogenerated-audio-player.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { AudioTranslationManagerService } from '../services/audio-translation-manager.service';
import { CurrentInteractionService } from '../services/current-interaction.service';
import { PlayerPositionService } from '../services/player-position.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-supplemental-card',
  templateUrl: './supplemental-card.component.html'
})
export class SupplementalCardComponent implements OnInit, OnDestroy {
  @Output() clickContinueButton: EventEmitter<void> = new EventEmitter();
  @Input() isLearnAgainButton: boolean;
  @Input() displayedCard: StateCard;
  @ViewChild('helpCard') helpCard: ElementRef;
  @ViewChild('interactionContainer') interactionContainer: ElementRef;
  currentDisplayedCard: StateCard;
  directiveSubscriptions = new Subscription();
  lastAnswer = null;
  maxHelpCardHeightSeen: number = 0;
  helpCardHtml: string;
  helpCardHasContinueButton: boolean = false;
  OPPIA_AVATAR_IMAGE_URL: string;
  OPPIA_AVATAR_LINK_URL: string = AppConstants.OPPIA_AVATAR_LINK_URL;
  CONTINUE_BUTTON_FOCUS_LABEL: string = (
    ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL);
  helpCardBottomPosition: number = 0;

  constructor(
    private audioPlayerService: AudioPlayerService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private autogeneratedAudioPlayerService: AutogeneratedAudioPlayerService,
    private changeDetectorRef: ChangeDetectorRef,
    private currentInteractionService: CurrentInteractionService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));

    this.currentInteractionService.registerPresubmitHook(() => {
      // Do not clear the help card or submit an answer if there is an
      // upcoming card.
      if (this.currentDisplayedCard.isCompleted()) {
        return;
      }

      this.clearHelpCard();
    });

    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(
        () => {
          this.updateDisplayedCard();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onHelpCardAvailable.subscribe(
        (helpCard) => {
          this.helpCardHtml = helpCard.helpCardHtml;
          this.helpCardHasContinueButton = helpCard.hasContinueButton;
        }
      )
    );
    this.updateDisplayedCard();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  updateDisplayedCard(): void {
    this.currentDisplayedCard = this.displayedCard;
    this.clearHelpCard();
    this.lastAnswer = null;
    if (this.displayedCard.isCompleted()) {
      this.lastAnswer = this.currentDisplayedCard.getLastAnswer();
    }
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  // We use the max because the height property of the help card is
  // unstable while animating, causing infinite digest errors.
  clearHelpCard(): void {
    this.helpCardHtml = null;
    this.helpCardHasContinueButton = false;
    this.maxHelpCardHeightSeen = 0;
  }

  isHelpCardTall(): boolean {
    let helpCard = $('.conversation-skin-help-card');

    if (helpCard.height() > this.maxHelpCardHeightSeen) {
      this.maxHelpCardHeightSeen = helpCard.height();
    }

    if (this.maxHelpCardHeightSeen >
      this.windowRef.nativeWindow.innerHeight - 100) {
      return true;
    }

    this.updateHelpCardBottomPosition();
    return false;
  }

  updateHelpCardBottomPosition(): void {
    let helpCardHeight = 0;
    if (this.helpCard) {
      helpCardHeight = this.helpCard.nativeElement.clientHeight;
    }

    let containerHeight = (
      this.interactionContainer.nativeElement.clientHeight);

    let bottomPosition = Math.max(containerHeight - helpCardHeight / 2, 0);

    if (this.helpCardBottomPosition !== bottomPosition) {
      this.helpCardBottomPosition = bottomPosition;
      this.changeDetectorRef.detectChanges();
    }
  }

  getFeedbackAudioHighlightClass(): string {
    if (this.audioTranslationManagerService
      .getCurrentComponentName() ===
      AppConstants.COMPONENT_NAME_FEEDBACK &&
      (this.audioPlayerService.isPlaying() ||
      this.autogeneratedAudioPlayerService.isPlaying())) {
      return ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS;
    }
  }
}

angular.module('oppia').directive('oppiaSupplementalCard',
  downgradeComponent({
    component: SupplementalCardComponent
  }) as angular.IDirectiveFactory);
